import { Request, Response } from 'express';
import { prisma } from '../index';

export const getDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId, search } = req.query;
    const where: any = {};
    if (departmentId) where.departmentId = departmentId as string;
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search as string } } },
        { user: { lastName: { contains: search as string } } },
        { specialization: { contains: search as string } },
      ];
    }

    const doctors = await prisma.profileDoctor.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        department: true,
        schedules: true,
      }
    });

    res.json({ doctors });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const doctor = await prisma.profileDoctor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        department: true,
        schedules: true,
        appointments: { include: { patient: { include: { user: true } } }, orderBy: { appointmentDate: 'desc' }, take: 10 }
      }
    });

    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }

    res.json({ doctor });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { doctors: true, staff: true, wards: true } }
      }
    });
    res.json({ departments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      res.status(400).json({ message: 'Department already exists' });
      return;
    }
    const dept = await prisma.department.create({ data: { name, description } });
    res.status(201).json({ department: dept });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { date } = req.query;

    const doctor = await prisma.profileDoctor.findUnique({
      where: { id },
      include: {
        schedules: true,
        appointments: {
          where: {
            appointmentDate: {
              gte: new Date(date as string),
              lt: new Date(new Date(date as string).getTime() + 86400000)
            },
            status: { not: 'CANCELLED' }
          }
        }
      }
    });

    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }

    res.json({ schedules: doctor.schedules, bookedAppointments: doctor.appointments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
