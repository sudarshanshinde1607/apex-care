import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { seedDatabase } from '../utils/seed';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      console.warn(`[Auth] Login failed: User not found for email "${normalizedEmail}"`);
      res.status(401).json({ message: 'Invalid credentials. User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Login failed: Incorrect password for "${normalizedEmail}"`);
      res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkeyforhms',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any }
    );

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        patient: true,
        doctor: true,
        staff: true
      }
    });

    res.json({
      token,
      user: userProfile || {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        patient: true,
        doctor: true,
        staff: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSeedStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      isSeeded: userCount > 0,
      userCount,
      defaultCredentials: [
        { role: 'Super Admin', email: 'admin@hms.com', password: 'password123' },
        { role: 'Doctor (Cardiologist)', email: 'doctor1@hms.com', password: 'password123' },
        { role: 'Nurse', email: 'nurse1@hms.com', password: 'password123' },
        { role: 'Receptionist', email: 'receptionist@hms.com', password: 'password123' },
        { role: 'Pharmacist', email: 'pharmacist@hms.com', password: 'password123' },
      ]
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error checking database status', error: error.message });
  }
};

export const triggerSeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const userCount = await prisma.user.count();
    // Allow seeding if database is empty, or if explicit force query is passed
    const force = req.query.force === 'true';
    if (userCount > 0 && !force) {
      res.status(400).json({ message: 'Database is already seeded with users.', userCount });
      return;
    }

    console.log('[Auth] Manual seed triggered...');
    await seedDatabase(prisma, force);
    const newCount = await prisma.user.count();
    res.json({
      message: 'Database seeded successfully!',
      userCount: newCount,
    });
  } catch (error: any) {
    console.error('[Auth] Seed failed:', error);
    res.status(500).json({ message: 'Failed to seed database', error: error.message });
  }
};

