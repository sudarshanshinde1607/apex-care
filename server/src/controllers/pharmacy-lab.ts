import { Request, Response } from 'express';
import { prisma } from '../index';

// Pharmacy
export const getMedicines = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category } = req.query;
    const where: any = {};
    if (category) where.category = category as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { genericName: { contains: search as string } }
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' }
        }
      }
    });

    // Calculate total stock and flag low/expired items
    const medicinesWithStock = medicines.map(m => {
      const totalStock = m.batches.reduce((sum, b) => sum + b.quantity, 0);
      const nearExpiry = m.batches.some(b => {
        const daysToExpiry = (new Date(b.expiryDate).getTime() - Date.now()) / 86400000;
        return daysToExpiry <= 90;
      });
      return { ...m, totalStock, nearExpiry };
    });

    res.json({ medicines: medicinesWithStock });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, genericName, category, manufacturer, unitPrice } = req.body;
    const medicine = await prisma.medicine.create({
      data: { name, genericName, category, manufacturer, unitPrice: parseFloat(unitPrice) }
    });
    res.status(201).json({ medicine });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addMedicineBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { medicineId, supplierId, batchNo, manufactureDate, expiryDate, quantity } = req.body;
    const batch = await prisma.medicineBatch.create({
      data: {
        medicineId,
        supplierId,
        batchNo,
        manufactureDate: new Date(manufactureDate),
        expiryDate: new Date(expiryDate),
        quantity: parseInt(quantity)
      },
      include: { medicine: true, supplier: true }
    });
    res.status(201).json({ batch });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { batches: true } } }
    });
    res.json({ suppliers });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, contact, address } = req.body;
    const supplier = await prisma.supplier.create({ data: { name, contact, address } });
    res.status(201).json({ supplier });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Laboratory
export const getLabTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const tests = await prisma.labTest.findMany({
      include: { _count: { select: { orders: true } } }
    });
    res.json({ tests });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createLabTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price } = req.body;
    const test = await prisma.labTest.create({ data: { name, description, price: parseFloat(price) } });
    res.status(201).json({ test });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLabOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, patientId, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = {};
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    const [orders, total] = await Promise.all([
      prisma.labOrder.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          test: true,
          result: true
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { orderDate: 'desc' }
      }),
      prisma.labOrder.count({ where })
    ]);

    res.json({ orders, total });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createLabOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, testId } = req.body;
    const order = await prisma.labOrder.create({
      data: { patientId, testId, status: 'PENDING' },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        test: true
      }
    });
    res.status(201).json({ order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLabOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const order = await prisma.labOrder.update({
      where: { id },
      data: { status }
    });
    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const enterLabResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, resultData, reportUrl } = req.body;

    const result = await prisma.labResult.upsert({
      where: { orderId },
      create: { orderId, resultData, reportUrl },
      update: { resultData, reportUrl }
    });

    await prisma.labOrder.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' }
    });

    res.json({ result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
