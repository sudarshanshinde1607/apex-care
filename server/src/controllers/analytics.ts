import { Request, Response } from 'express';
import { prisma } from '../index';

export const getChartData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = '7' } = req.query;
    const numDays = parseInt(days as string, 10);
    
    // Generate dates for the last N days
    const dates: Date[] = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }

    // Initialize chart data structure
    const revenueByDay = dates.map(d => ({ date: d.toISOString().split('T')[0], revenue: 0 }));
    const appointmentsByDay = dates.map(d => ({ date: d.toISOString().split('T')[0], count: 0 }));

    // Calculate start and end range
    const startDate = dates[0];
    const endDate = new Date(dates[dates.length - 1]);
    endDate.setHours(23, 59, 59, 999);

    // Fetch data concurrently
    const [invoices, appointments] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          issueDate: { gte: startDate, lte: endDate },
          status: 'PAID'
        },
        select: { issueDate: true, netAmount: true }
      }),
      prisma.appointment.findMany({
        where: {
          appointmentDate: { gte: startDate, lte: endDate }
        },
        select: { appointmentDate: true }
      })
    ]);

    // Aggregate revenue
    invoices.forEach(inv => {
      const dateStr = inv.issueDate.toISOString().split('T')[0];
      const entry = revenueByDay.find(r => r.date === dateStr);
      if (entry) {
        entry.revenue += inv.netAmount;
      }
    });

    // Aggregate appointments
    appointments.forEach(app => {
      const dateStr = app.appointmentDate.toISOString().split('T')[0];
      const entry = appointmentsByDay.find(r => r.date === dateStr);
      if (entry) {
        entry.count += 1;
      }
    });

    res.json({
      revenueByDay,
      appointmentsByDay,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
