import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import prisma from '../lib/prisma';
import { EventStatus, SwapStatus } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all swappable slots from other users
router.get('/swappable-slots', async (req: AuthRequest, res: Response) => {
  try {
    const swappableSlots = await prisma.event.findMany({
      where: {
        status: EventStatus.SWAPPABLE,
        userId: {
          not: req.userId!,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json(swappableSlots);
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's swap requests (incoming and outgoing)
router.get('/swap-requests', async (req: AuthRequest, res: Response) => {
  try {
    const incoming = await prisma.swapRequest.findMany({
      where: {
        responderId: req.userId!,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mySlot: true,
        theirSlot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const outgoing = await prisma.swapRequest.findMany({
      where: {
        requesterId: req.userId!,
      },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mySlot: true,
        theirSlot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      incoming,
      outgoing,
    });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a swap request
router.post('/swap-request', async (req: AuthRequest, res: Response) => {
  try {
    const { mySlotId, theirSlotId } = req.body;

    if (!mySlotId || !theirSlotId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify mySlot belongs to the user and is SWAPPABLE
    const mySlot = await prisma.event.findFirst({
      where: {
        id: mySlotId,
        userId: req.userId!,
        status: EventStatus.SWAPPABLE,
      },
    });

    if (!mySlot) {
      return res.status(400).json({
        error: 'Your slot not found or not swappable',
      });
    }

    // Verify theirSlot exists and is SWAPPABLE
    const theirSlot = await prisma.event.findFirst({
      where: {
        id: theirSlotId,
        status: EventStatus.SWAPPABLE,
        userId: {
          not: req.userId!,
        },
      },
      include: {
        user: true,
      },
    });

    if (!theirSlot) {
      return res.status(400).json({
        error: 'Their slot not found or not swappable',
      });
    }

    // Check if either slot is already involved in a pending swap
    const existingSwap = await prisma.swapRequest.findFirst({
      where: {
        OR: [
          {
            mySlotId: mySlotId,
            status: SwapStatus.PENDING,
          },
          {
            theirSlotId: mySlotId,
            status: SwapStatus.PENDING,
          },
          {
            mySlotId: theirSlotId,
            status: SwapStatus.PENDING,
          },
          {
            theirSlotId: theirSlotId,
            status: SwapStatus.PENDING,
          },
        ],
      },
    });

    if (existingSwap) {
      return res.status(400).json({
        error: 'One or both slots are already involved in a pending swap',
      });
    }

    // Create swap request and update slot statuses
    const swapRequest = await prisma.$transaction(async (tx) => {
      // Update both slots to SWAP_PENDING
      await tx.event.update({
        where: { id: mySlotId },
        data: { status: EventStatus.SWAP_PENDING },
      });

      await tx.event.update({
        where: { id: theirSlotId },
        data: { status: EventStatus.SWAP_PENDING },
      });

      // Create swap request
      return await tx.swapRequest.create({
        data: {
          mySlotId,
          theirSlotId,
          requesterId: req.userId!,
          responderId: theirSlot.userId,
          status: SwapStatus.PENDING,
        },
        include: {
          mySlot: true,
          theirSlot: true,
          responder: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    res.status(201).json(swapRequest);
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Respond to a swap request
router.post('/swap-response/:requestId', async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { accepted } = req.body;

    if (typeof accepted !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid accepted field' });
    }

    // Verify swap request exists and belongs to the user as responder
    const swapRequest = await prisma.swapRequest.findFirst({
      where: {
        id: requestId,
        responderId: req.userId!,
        status: SwapStatus.PENDING,
      },
      include: {
        mySlot: true,
        theirSlot: true,
      },
    });

    if (!swapRequest) {
      return res.status(404).json({
        error: 'Swap request not found or already processed',
      });
    }

    if (accepted) {
      // ACCEPTED: Exchange the owners of the two slots and set status to BUSY
      await prisma.$transaction(async (tx) => {
        // Update swap request status
        await tx.swapRequest.update({
          where: { id: requestId },
          data: { status: SwapStatus.ACCEPTED },
        });

        // Exchange the owners
        const tempUserId = swapRequest.mySlot.userId;
        
        await tx.event.update({
          where: { id: swapRequest.mySlotId },
          data: {
            userId: swapRequest.theirSlot.userId,
            status: EventStatus.BUSY,
          },
        });

        await tx.event.update({
          where: { id: swapRequest.theirSlotId },
          data: {
            userId: tempUserId,
            status: EventStatus.BUSY,
          },
        });
      });

      res.json({ message: 'Swap accepted successfully' });
    } else {
      // REJECTED: Set swap request to REJECTED and set both slots back to SWAPPABLE
      await prisma.$transaction(async (tx) => {
        // Update swap request status
        await tx.swapRequest.update({
          where: { id: requestId },
          data: { status: SwapStatus.REJECTED },
        });

        // Set both slots back to SWAPPABLE
        await tx.event.update({
          where: { id: swapRequest.mySlotId },
          data: { status: EventStatus.SWAPPABLE },
        });

        await tx.event.update({
          where: { id: swapRequest.theirSlotId },
          data: { status: EventStatus.SWAPPABLE },
        });
      });

      res.json({ message: 'Swap rejected' });
    }
  } catch (error) {
    console.error('Swap response error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

