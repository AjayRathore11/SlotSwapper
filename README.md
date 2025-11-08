# SlotSwapper

A peer-to-peer time-slot scheduling application where users can swap their busy calendar slots with others.

## Features

- User Authentication (JWT-based)
- Calendar Management (Create, Update, Delete events)
- Mark slots as swappable
- Browse available swappable slots from other users
- Request swaps with other users
- Accept/Reject swap requests
- Real-time state updates

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication

### Frontend
- React + TypeScript
- React Router
- Axios for API calls
- Modern UI with Tailwind CSS

## Project Structure

```
SlotSwapperC/
├── backend/          # Express API server
├── frontend/         # React application
├── docker-compose.yml
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (or use Docker)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the backend directory:
```
DATABASE_URL="postgresql://user:password@localhost:5432/slotswapper"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

The backend API will be running on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```
VITE_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:5173` (or another port if 5173 is taken)

### Docker Setup

1. Build and start containers:
```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API server on port 3001
- Frontend application on port 5173

**Note:** After starting the containers, you need to run database migrations:

```bash
# Enter the backend container
docker-compose exec backend sh

# Run migrations
npx prisma migrate dev

# Exit the container
exit
```

Alternatively, you can run the migration from outside:
```bash
docker-compose exec backend npx prisma migrate dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get user's events
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

### Swaps
- `GET /api/swappable-slots` - Get all swappable slots from other users
- `POST /api/swap-request` - Request a swap
- `POST /api/swap-response/:requestId` - Accept/Reject a swap request
- `GET /api/swap-requests` - Get user's swap requests (incoming and outgoing)

## Usage Guide

### Getting Started

1. **Sign Up**: Create a new account with your name, email, and password.

2. **Create Events**: 
   - Go to the Calendar/Dashboard page
   - Click "Create Event" to add a new event with a title, start time, and end time
   - Events are created as "BUSY" by default

3. **Make Events Swappable**:
   - In the Calendar view, click "Make Swappable" on any BUSY event
   - The event status will change to "SWAPPABLE"
   - Other users can now see and request swaps for this slot

4. **Browse Marketplace**:
   - Go to the Marketplace page
   - View all available swappable slots from other users
   - Click "Request Swap" on any slot you're interested in

5. **Request a Swap**:
   - When you click "Request Swap", a modal will appear
   - Select one of your own swappable slots to offer in exchange
   - Click "Send Request" to submit the swap request

6. **Handle Swap Requests**:
   - Go to the Requests page
   - View incoming requests (swaps others want from you)
   - View outgoing requests (swaps you've requested)
   - Accept or reject incoming requests
   - When a swap is accepted, both calendars are automatically updated

### Important Notes

- Events involved in pending swaps cannot be modified or deleted
- Once a swap is accepted, the event ownership is exchanged between users
- Accepted swaps set both events back to BUSY status
- Rejected swaps return both events to SWAPPABLE status

## Development

### Running Tests

Currently, no tests are included. To add tests:

1. For backend: Install Jest and Supertest
2. For frontend: Install React Testing Library

### Project Structure

```
backend/
├── src/
│   ├── lib/          # Prisma client
│   ├── middleware/   # Auth middleware
│   ├── routes/       # API routes
│   └── index.ts      # Entry point
├── prisma/
│   └── schema.prisma # Database schema
└── package.json

frontend/
├── src/
│   ├── components/   # React components
│   ├── contexts/     # React contexts (Auth)
│   ├── lib/          # API utilities
│   ├── pages/        # Page components
│   ├── App.tsx       # Main app component
│   └── main.tsx      # Entry point
└── package.json
```

## License

MIT

