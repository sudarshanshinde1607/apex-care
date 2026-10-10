import { Request, Response } from 'express';
import { prisma } from '../index';

async function generateInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
}

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          items: true,
          payments: true
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { issueDate: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({ invoices, total });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        items: true,
        payments: true
      }
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    res.json({ invoice });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, items, taxRate = 0, discount = 0, dueDate } = req.body;

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = totalAmount * (taxRate / 100);
    const netAmount = totalAmount + taxAmount - discount;
    const invoiceNo = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        patientId,
        totalAmount,
        taxAmount,
        discount,
        netAmount,
        status: 'UNPAID',
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            total: parseInt(item.quantity) * parseFloat(item.unitPrice)
          }))
        }
      },
      include: { items: true, patient: { include: { user: { select: { firstName: true, lastName: true } } } } }
    });

    res.status(201).json({ invoice });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invoiceId, amount, paymentMethod, transactionId } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: parseFloat(amount),
        paymentMethod,
        transactionId
      }
    });

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + parseFloat(amount);
    const newStatus = totalPaid >= invoice.netAmount ? 'PAID' : 'PARTIAL';

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus }
    });

    res.status(201).json({ payment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Dashboard stats
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const [
      totalPatients,
      todayAppointments,
      totalRevenue,
      availableBeds,
      totalBeds,
      pendingLabOrders,
      recentPatients,
      appointmentsByStatus
    ] = await Promise.all([
      prisma.profilePatient.count(),
      prisma.appointment.count({ where: { appointmentDate: { gte: todayStart, lt: todayEnd } } }),
      prisma.invoice.aggregate({ _sum: { netAmount: true }, where: { status: 'PAID' } }),
      prisma.bed.count({ where: { status: 'AVAILABLE' } }),
      prisma.bed.count(),
      prisma.labOrder.count({ where: { status: 'PENDING' } }),
      prisma.profilePatient.findMany({
        take: 5,
        orderBy: { patientId: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, createdAt: true } } }
      }),
      prisma.appointment.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { appointmentDate: { gte: todayStart, lt: todayEnd } }
      })
    ]);

    res.json({
      totalPatients,
      todayAppointments,
      totalRevenue: totalRevenue._sum.netAmount ?? 0,
      availableBeds,
      totalBeds,
      bedOccupancy: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
      pendingLabOrders,
      recentPatients,
      appointmentsByStatus
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Wards & Beds
export const getWards = async (req: Request, res: Response): Promise<void> => {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        department: true,
        rooms: {
          include: {
            beds: {
              include: {
                admissions: {
                  where: { status: 'ADMITTED' },
                  include: {
                    patient: { include: { user: { select: { firstName: true, lastName: true } } } }
                  }
                }
              }
            }
          }
        }
      }
    });
    res.json({ wards });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const admitPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, doctorId, bedId, reason } = req.body;

    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed || bed.status !== 'AVAILABLE') {
      res.status(400).json({ message: 'Bed is not available' });
      return;
    }

    const [admission] = await prisma.$transaction([
      prisma.admission.create({
        data: { patientId, doctorId, bedId, reason, status: 'ADMITTED' }
      }),
      prisma.bed.update({
        where: { id: bedId },
        data: { status: 'OCCUPIED' }
      })
    ]);

    res.status(201).json({ admission });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const dischargePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { dischargeSummary } = req.body;

    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) {
      res.status(404).json({ message: 'Admission not found' });
      return;
    }

    const [updatedAdmission] = await prisma.$transaction([
      prisma.admission.update({
        where: { id },
        data: { status: 'DISCHARGED', dischargeDate: new Date(), dischargeSummary }
      }),
      prisma.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' }
      })
    ]);

    res.json({ admission: updatedAdmission });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'ADMITTED', page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where: { status: status as string },
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          bed: { include: { room: { include: { ward: true } } } }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { admissionDate: 'desc' }
      }),
      prisma.admission.count({ where: { status: status as string } })
    ]);

    res.json({ admissions, total });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { firstName: true, lastName: true, role: true } } },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count()
    ]);

    res.json({ logs, total });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
