/**
 * Bootstrap a platform admin user.
 * Usage: npx ts-node scripts/create-admin.ts admin@example.com SecretPass123
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "admin@estate.local";
  const password = process.argv[3] || "Admin123!";
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", isActive: true, passwordHash: hash },
    create: {
      email,
      passwordHash: hash,
      firstName: "Platform",
      lastName: "Admin",
      phoneNumber: "+251900000000",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Admin ready: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
