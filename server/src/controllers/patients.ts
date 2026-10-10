import { Request, Response } from 'express';
import { prisma } from '../index';

// Helper to generate patient ID
async function generatePatientId(): Promise<string> {
  const count = await prisma.profilePatient.count();
  return `PAT-${String(count + 1).padStart(6, '0')}`;
}

export const getPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { patientId: { contains: search as string } },
        { user: { firstName: { contains: search as string } } },
        { user: { lastName: { contains: search as string } } },
        { user: { email: { contains: search as string } } },
        { user: { phone: { contains: search as string } } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.profilePatient.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { patientId: 'asc' }
      }),
      prisma.profilePatient.count({ where })
    ]);

    res.json({ patients, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const patient = await prisma.profilePatient.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true } },
        appointments: { include: { doctor: { include: { user: true } } }, orderBy: { appointmentDate: 'desc' }, take: 10 },
        consultations: { include: { doctor: { include: { user: true } }, vitals: true, prescription: { include: { items: { include: { medicine: true } } } } }, orderBy: { id: 'desc' }, take: 10 },
        labOrders: { include: { test: true, result: true }, orderBy: { orderDate: 'desc' }, take: 10 },
        invoices: { orderBy: { issueDate: 'desc' }, take: 10 },
        admissions: { include: { doctor: { include: { user: true } }, bed: { include: { room: { include: { ward: true } } } } }, orderBy: { admissionDate: 'desc' }, take: 5 },
      }
    });

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.json({ patient });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, dob, gender, bloodGroup, address, emergencyContact, allergies } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    const patientId = await generatePatientId();

    const patient = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'PATIENT',
        patient: {
          create: {
            patientId,
            dob: new Date(dob),
            gender,
            bloodGroup,
            address,
            emergencyContact,
            allergies
          }
        }
      },
      include: { patient: true }
    });

    res.status(201).json({ patient });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updatePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { firstName, lastName, phone, dob, gender, bloodGroup, address, emergencyContact, allergies } = req.body;

    const profile = await prisma.profilePatient.findUnique({ where: { id }, include: { user: true } });
    if (!profile) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    await prisma.user.update({
      where: { id: profile.userId },
      data: { firstName, lastName, phone }
    });

    const updated = await prisma.profilePatient.update({
      where: { id },
      data: {
        dob: dob ? new Date(dob) : undefined,
        gender,
        bloodGroup,
        address,
        emergencyContact,
        allergies
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } } }
    });

    res.json({ patient: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
