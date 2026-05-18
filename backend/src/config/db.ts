import { PrismaClient } from '@prisma/client';

// This is your gateway to the database
const prisma = new PrismaClient();

export default prisma;