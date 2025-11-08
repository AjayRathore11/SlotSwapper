# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL installed (or use Docker)
- npm or yarn

## Option 1: Local Development (Recommended for first-time setup)

### Step 1: Set up the Database

1. Create a PostgreSQL database:
```bash
createdb slotswapper
```

Or using psql:
```sql
CREATE DATABASE slotswapper;
```

### Step 2: Set up the Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
# Copy the example and edit as needed
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/slotswapper"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
```

4. Run database migrations:
```bash
npx prisma migrate dev --name init
```

5. Start the backend server:
```bash
npm run dev
```

The backend should now be running on `http://localhost:3001`

### Step 3: Set up the Frontend

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
VITE_API_URL=http://localhost:3001
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

### Step 4: Use the Application

1. Open your browser and go to `http://localhost:5173`
2. Sign up for a new account
3. Create some events in the Calendar
4. Mark events as "Swappable"
5. Open the application in another browser (or incognito mode) to create a second user
6. Browse the Marketplace to see swappable slots
7. Request swaps and accept/reject them!

## Option 2: Docker Setup

### Step 1: Start all services

```bash
docker-compose up --build
```

### Step 2: Run database migrations

In a new terminal:
```bash
docker-compose exec backend npx prisma migrate dev --name init
```

### Step 3: Access the application

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Database: `localhost:5432`

## Troubleshooting

### Database Connection Issues

If you're having trouble connecting to the database:

1. Make sure PostgreSQL is running:
```bash
# On macOS/Linux
pg_isready

# On Windows
# Check PostgreSQL service in Services
```

2. Verify your DATABASE_URL in the `.env` file matches your PostgreSQL credentials

### Port Already in Use

If port 3001 or 5173 is already in use:

1. Backend: Change `PORT` in `backend/.env`
2. Frontend: Change the port in `frontend/vite.config.ts` and update `VITE_API_URL` accordingly

### Prisma Migration Issues

If migrations fail:

1. Reset the database (⚠️ This will delete all data):
```bash
npx prisma migrate reset
```

2. Then run migrations again:
```bash
npx prisma migrate dev
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the API endpoints in the README
- Explore the codebase to understand the implementation

## Need Help?

- Check the console logs for error messages
- Verify all environment variables are set correctly
- Ensure all dependencies are installed
- Make sure the database is accessible

