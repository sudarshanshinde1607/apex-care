import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/utils/seed';

const prisma = new PrismaClient();

seedDatabase(prisma, true)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
