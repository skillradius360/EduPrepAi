const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('EduPrep AI seed is intentionally non-destructive.');
  console.log('No demo users, curriculum, questions, tests, attempts, or syllabus sources are created.');
  console.log('Use the app UI and Admin > Syllabus Sources to add real data.');
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
