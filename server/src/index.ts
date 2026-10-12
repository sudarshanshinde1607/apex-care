import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
import fs from 'fs';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';
import { seedDatabase } from './utils/seed';

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', apiRoutes);

app.get('/api/v1/health', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.status(200).json({
      status: 'ok',
      message: 'HMS API is running',
      database: 'connected',
      usersCount: userCount
    });
  } catch (error: any) {
    res.status(200).json({
      status: 'degraded',
      message: 'API is running but database is not reachable',
      databaseError: error.message
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
});

// Serve client static files (SPA fallback)
const possiblePaths = [
  path.join(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
];
const clientDistPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // Catch-all: serve index.html for React Router
  app.use((req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Automatically check database and seed if empty
  try {
    const userCount = await prisma.user.count();
    console.log(`[DB] Connected successfully. Existing users count: ${userCount}`);
    if (userCount === 0) {
      console.log('[DB] No users found. Auto-seeding initial data with demo credentials...');
      await seedDatabase(prisma, false);
      console.log('[DB] Auto-seed complete! Default login credentials: admin@hms.com / password123');
    }
  } catch (err: any) {
    console.error('[DB] Connection check / auto-seed encountered an error:', err.message);
  }
});
