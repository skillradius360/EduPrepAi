const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding College (UG/PG UGC Model) and Competitive (GATE/CAT) curriculum...');

  // 1. College UG - B.Tech Computer Science & Engineering (UGC Model Syllabus)
  const collegeSubject1 = await prisma.subject.create({
    data: {
      name: 'Operating Systems',
      class: 'UG',
      board: 'UGC',
      tier: 'COLLEGE',
      degreeMajor: 'B.Tech Computer Science & Engineering',
      syllabusType: 'UGC_MODEL',
      universityName: null,
      semester: 4,
      chapters: {
        create: [
          {
            name: 'Process Management and Concurrency',
            topics: {
              create: [
                { name: 'CPU Scheduling Algorithms (FCFS, SJF, Round Robin)' },
                { name: 'Process Synchronization and Semaphores' },
                { name: 'Deadlock Detection, Prevention and Banker Algorithm' },
              ],
            },
          },
          {
            name: 'Memory Management',
            topics: {
              create: [
                { name: 'Virtual Memory and Paging' },
                { name: 'Page Replacement Algorithms (FIFO, LRU, Optimal)' },
                { name: 'Segmentation and Fragmentation' },
              ],
            },
          },
        ],
      },
    },
  });

  const collegeSubject2 = await prisma.subject.create({
    data: {
      name: 'Database Management Systems',
      class: 'UG',
      board: 'UGC',
      tier: 'COLLEGE',
      degreeMajor: 'B.Tech Computer Science & Engineering',
      syllabusType: 'UGC_MODEL',
      universityName: null,
      semester: 4,
      chapters: {
        create: [
          {
            name: 'Relational Database Design',
            topics: {
              create: [
                { name: 'Entity-Relationship (ER) Modeling' },
                { name: 'Functional Dependencies and Normal Forms (1NF to BCNF)' },
                { name: 'Relational Algebra and Tuple Calculus' },
              ],
            },
          },
          {
            name: 'Transaction and Concurrency Control',
            topics: {
              create: [
                { name: 'ACID Properties and Serializability' },
                { name: 'Lock-based Protocols and Two-Phase Locking (2PL)' },
              ],
            },
          },
        ],
      },
    },
  });

  // 2. Competitive Exam - GATE Computer Science (GATE CS)
  const competitiveSubject1 = await prisma.subject.create({
    data: {
      name: 'Computer Networks (GATE CS)',
      class: 'Entrance',
      board: 'National',
      tier: 'COMPETITIVE',
      degreeMajor: null,
      syllabusType: 'PYQ_OFFICIAL',
      universityName: null,
      chapters: {
        create: [
          {
            name: 'Transport and Network Layer Routing',
            topics: {
              create: [
                { name: 'TCP Congestion Control & Window Flow Control' },
                { name: 'IPv4/IPv6 Subnetting, CIDR, and Routing Protocols' },
                { name: 'Error Detection, CRC and Sliding Window Protocols' },
              ],
            },
          },
        ],
      },
    },
  });

  // 3. Competitive Exam - CAT Quantitative Aptitude (CAT)
  const competitiveSubject2 = await prisma.subject.create({
    data: {
      name: 'Quantitative Aptitude (CAT)',
      class: 'Entrance',
      board: 'National',
      tier: 'COMPETITIVE',
      degreeMajor: null,
      syllabusType: 'PYQ_OFFICIAL',
      universityName: null,
      chapters: {
        create: [
          {
            name: 'Arithmetic and Number Systems',
            topics: {
              create: [
                { name: 'Time, Speed and Distance (Races and Escalators)' },
                { name: 'Profit, Loss, Discount and Simple/Compound Interest' },
                { name: 'Remainders, Factors, and Base Systems' },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seeded successfully:');
  console.log(`- College: ${collegeSubject1.name}, ${collegeSubject2.name}`);
  console.log(`- Competitive: ${competitiveSubject1.name}, ${competitiveSubject2.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
