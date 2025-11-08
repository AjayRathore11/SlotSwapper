import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import prisma from '../lib/prisma';
import { EventStatus } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's events
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        userId: req.userId!,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new event
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, startTime, endTime, status } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || EventStatus.BUSY,
        userId: req.userId!,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an event
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, startTime, endTime, status } = req.body;

    // Verify event belongs to user
    const existingEvent = await prisma.event.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // If status is being changed and event is involved in a pending swap, prevent change
    if (status && status !== existingEvent.status) {
      const pendingSwap = await prisma.swapRequest.findFirst({
        where: {
          OR: [
            { mySlotId: id, status: 'PENDING' },
            { theirSlotId: id, status: 'PENDING' },
          ],
        },
      });

      if (pendingSwap) {
        return res.status(400).json({
          error: 'Cannot change status of event involved in pending swap',
        });
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(status && { status }),
      },
    });

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an event
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify event belongs to user
    const existingEvent = await prisma.event.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is involved in a pending swap
    const pendingSwap = await prisma.swapRequest.findFirst({
      where: {
        OR: [
          { mySlotId: id, status: 'PENDING' },
          { theirSlotId: id, status: 'PENDING' },
        ],
      },
    });

    if (pendingSwap) {
      return res.status(400).json({
        error: 'Cannot delete event involved in pending swap',
      });
    }

    await prisma.event.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

