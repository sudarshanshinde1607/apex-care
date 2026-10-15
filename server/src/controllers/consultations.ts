import { Request, Response } from 'express';
import { prisma } from '../index';

export const getConsultations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, doctorId, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const currentUser = (req as any).user;
    const where: any = {};

    if (currentUser?.role === 'PATIENT') {
      const patientProfile = await prisma.profilePatient.findUnique({
        where: { userId: currentUser.id }
      });
      if (!patientProfile) {
        res.json({ consultations: [], total: 0 });
        return;
      }
      where.patientId = patientProfile.id;
    } else if (patientId) {
      where.patientId = patientId as string;
    }

    if (doctorId) where.doctorId = doctorId as string;

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          vitals: true,
          prescription: { include: { items: { include: { medicine: true } } } }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { id: 'desc' }
      }),
      prisma.consultation.count({ where })
    ]);

    res.json({ consultations, total });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId, symptoms, diagnosis, notes, followUpDate, vitals, prescription } = req.body;

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    const existingConsult = await prisma.consultation.findUnique({ where: { appointmentId } });
    if (existingConsult) {
      res.status(400).json({ message: 'Consultation already exists for this appointment' });
      return;
    }

    // Calculate BMI if height and weight given
    let bmi: number | undefined;
    if (vitals?.weight && vitals?.height) {
      const heightM = vitals.height / 100;
      bmi = parseFloat((vitals.weight / (heightM * heightM)).toFixed(1));
    }

    const consultation = await prisma.consultation.create({
      data: {
        appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        symptoms,
        diagnosis,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        vitals: vitals ? {
          create: {
            bloodPressure: vitals.bloodPressure,
            pulse: vitals.pulse ? parseInt(vitals.pulse) : null,
            temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
            spO2: vitals.spO2 ? parseFloat(vitals.spO2) : null,
            weight: vitals.weight ? parseFloat(vitals.weight) : null,
            height: vitals.height ? parseFloat(vitals.height) : null,
            bmi: bmi ?? null
          }
        } : undefined,
        prescription: prescription ? {
          create: {
            instructions: prescription.instructions,
            items: {
              create: prescription.items?.map((item: any) => ({
                medicineId: item.medicineId,
                dosage: item.dosage,
                duration: parseInt(item.duration),
                instructions: item.instructions
              })) ?? []
            }
          }
        } : undefined
      },
      include: {
        vitals: true,
        prescription: { include: { items: { include: { medicine: true } } } },
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' }
    });

    res.status(201).json({ consultation });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } }, department: true } },
        appointment: true,
        vitals: true,
        prescription: { include: { items: { include: { medicine: true } } } }
      }
    });

    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    res.json({ consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
