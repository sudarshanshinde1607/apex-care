import { Request, Response } from 'express';
import { prisma } from '../index';

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, doctorId, status, date, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const currentUser = (req as any).user;
    const where: any = {};

    // If the authenticated user is a patient, strictly restrict to their own patient profile
    if (currentUser?.role === 'PATIENT') {
      const patientProfile = await prisma.profilePatient.findUnique({
        where: { userId: currentUser.id }
      });
      if (!patientProfile) {
        res.json({ appointments: [], total: 0, page: parseInt(page as string) });
        return;
      }
      where.patientId = patientProfile.id;
    } else if (patientId) {
      where.patientId = patientId as string;
    }

    if (doctorId) where.doctorId = doctorId as string;
    if (status) where.status = status as string;
    if (date) {
      const d = new Date(date as string);
      where.appointmentDate = {
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } }, department: true } },
          consultation: { select: { id: true } }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { appointmentDate: 'desc' }
      }),
      prisma.appointment.count({ where })
    ]);

    res.json({ appointments, total, page: parseInt(page as string) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    let { patientId, doctorId, appointmentDate, reason } = req.body;
    const currentUser = (req as any).user;

    // If booking as a patient, force the patientId to be their own profile ID
    if (currentUser?.role === 'PATIENT') {
      const patientProfile = await prisma.profilePatient.findUnique({
        where: { userId: currentUser.id }
      });
      if (!patientProfile) {
        res.status(403).json({ message: 'Patient profile not found for this user' });
        return;
      }
      patientId = patientProfile.id;
    }

    // Check for double-booking
    const conflicting = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: new Date(appointmentDate),
        status: { not: 'CANCELLED' }
      }
    });

    if (conflicting) {
      res.status(400).json({ message: 'This time slot is already booked' });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        reason,
        status: 'SCHEDULED'
      },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    res.status(201).json({ appointment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    res.json({ appointment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rescheduleAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { appointmentDate } = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    const conflicting = await prisma.appointment.findFirst({
      where: {
        doctorId: existing.doctorId,
        appointmentDate: new Date(appointmentDate),
        status: { not: 'CANCELLED' },
        id: { not: id }
      }
    });

    if (conflicting) {
      res.status(400).json({ message: 'This time slot is already booked' });
      return;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { appointmentDate: new Date(appointmentDate), status: 'SCHEDULED' }
    });

    res.json({ appointment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
