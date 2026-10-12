import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/utils/seed';

const prisma = new PrismaClient();

seedDatabase(prisma, false)
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
