const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Altering User table...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "institutionType" TEXT DEFAULT 'SCHOOL';`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "degreeMajor" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "universityName" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "semester" INTEGER;`);
  console.log('User table successfully updated with new columns!');
  
  const user = await prisma.user.findFirst();
  console.log('Sample user record verified:', user);
  await prisma.$disconnect();
}

run().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
