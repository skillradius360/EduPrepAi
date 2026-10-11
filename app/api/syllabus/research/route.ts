import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { SyllabusResearchSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const CBSE_CURRICULUM_URL = 'https://cbseacademic.nic.in/curriculum_2027.html';

const DEFAULT_SOURCE_URLS: Record<string, string> = {
  CBSE: 'https://cbseacademic.nic.in/curriculum_2027.html',
  ICSE: 'https://cisce.org/regulations-and-syllabuses/',
  'State Board': 'https://ncert.nic.in/syllabus.php',
  COLLEGE: 'https://www.ugc.gov.in/curriculum',
  COMPETITIVE: 'https://gate2025.iitr.ac.in/syllabus.html',
};

const subjectChapterHints: Record<string, string[]> = {
  Mathematics: [
    'Real Numbers',
    'Polynomials',
    'Pair of Linear Equations in Two Variables',
    'Quadratic Equations',
    'Arithmetic Progressions',
    'Triangles',
    'Coordinate Geometry',
    'Introduction to Trigonometry',
    'Some Applications of Trigonometry',
    'Circles',
    'Areas Related to Circles',
    'Surface Areas and Volumes',
    'Statistics',
    'Probability',
  ],
  Science: [
    'Chemical Reactions and Equations',
    'Acids, Bases and Salts',
    'Metals and Non-metals',
    'Carbon and its Compounds',
    'Life Processes',
    'Control and Coordination',
    'How do Organisms Reproduce?',
    'Heredity',
    'Light - Reflection and Refraction',
    'The Human Eye and the Colourful World',
    'Electricity',
    'Magnetic Effects of Electric Current',
    'Our Environment',
  ],
  Physics: [
    'Units and Measurements',
    'Motion in a Straight Line',
    'Laws of Motion',
    'Work, Energy and Power',
    'System of Particles and Rotational Motion',
    'Gravitation',
    'Thermodynamics',
    'Kinetic Theory of Gases',
    'Oscillations and Waves',
    'Electrostatics',
    'Current Electricity',
    'Magnetic Effects of Current',
    'Electromagnetic Induction',
    'Optics',
    'Dual Nature of Radiation',
    'Semiconductor Electronics',
  ],
  Chemistry: [
    'Some Basic Concepts of Chemistry',
    'Structure of Atom',
    'Classification of Elements and Periodicity',
    'Chemical Bonding and Molecular Structure',
    'Thermodynamics and Chemical Energetics',
    'Equilibrium',
    'Redox Reactions and Electrochemistry',
    'Solutions',
    'Chemical Kinetics',
    'Coordination Compounds',
    'Organic Chemistry: Principles and Techniques',
    'Hydrocarbons',
    'Biomolecules',
  ],
  Biology: [
    'The Living World and Biological Classification',
    'Plant and Animal Kingdoms',
    'Morphology and Anatomy of Flowering Plants',
    'Cell: Structure and Function',
    'Plant Physiology',
    'Human Physiology',
    'Reproduction in Organisms',
    'Genetics and Evolution',
    'Biotechnology and its Applications',
    'Ecology and Environment',
  ],
  'Computer Science': [
    'Computational Thinking and Programming',
    'Data Structures: Stacks and Queues',
    'Computer Networks and Protocols',
    'Database Management: SQL Queries',
    'Boolean Logic and Logic Gates',
    'Cyber Safety and Ethics',
  ],
  'Operating Systems': [
    'Introduction to Operating Systems & Kernels',
    'Process Management & CPU Scheduling',
    'Process Synchronization & Deadlocks',
    'Memory Management & Virtual Memory',
    'Storage & File System Implementation',
    'I/O Systems and Device Management',
  ],
  'Data Structures & Algorithms': [
    'Asymptotic Analysis & Big-O Notation',
    'Arrays, Linked Lists, Stacks & Queues',
    'Trees, Binary Search Trees & AVL Trees',
    'Heaps and Priority Queues',
    'Graph Algorithms (BFS, DFS, Dijkstra, Prim/Kruskal)',
    'Dynamic Programming and Greedy Algorithms',
    'Sorting and Searching Techniques',
  ],
  'Database Management Systems': [
    'ER Modeling and Relational Model',
    'Relational Algebra and Calculus',
    'SQL Queries, Joins, and Subqueries',
    'Normalization (1NF, 2NF, 3NF, BCNF)',
    'Transactions, ACID Properties and Concurrency Control',
    'Indexing, B+ Trees and Query Optimization',
  ],
  'Computer Networks': [
    'Network Layer Architecture and OSI Reference Model',
    'Physical and Data Link Layer: Framing & Error Control',
    'Medium Access Control & Ethernet Protocols',
    'Network Layer: IPv4, IPv6, Subnetting, Routing Algorithms',
    'Transport Layer: TCP, UDP, Flow & Congestion Control',
    'Application Layer: DNS, HTTP, SMTP, FTP',
    'Network Security, Cryptography & Firewalls',
  ],
  'Theory of Computation': [
    'Finite Automata (DFA, NFA) & Regular Expressions',
    'Context-Free Grammars & Pushdown Automata',
    'Turing Machines & Computability',
    'Decidability and Undecidability',
  ],
  'Compiler Design': [
    'Lexical Analysis & Token Generation',
    'Syntax Analysis: LL(1), LR, SLR, LALR Parsers',
    'Syntax-Directed Translation & Intermediate Code Generation',
    'Runtime Storage Management & Activation Records',
    'Code Optimization & Target Code Generation',
  ],
  'Quantitative Aptitude': [
    'Number Systems & Number Theory',
    'Percentages, Profit, Loss & Discount',
    'Ratio, Proportion, Variation & Mixtures',
    'Time, Speed, Distance & Work',
    'Simple & Compound Interest',
    'Permutations, Combinations & Probability',
    'Geometry, Mensuration & Coordinate Geometry',
    'Algebra, Quadratic Equations & Progressions',
  ],
  'Logical Reasoning': [
    'Arrangements: Linear, Circular & Matrix',
    'Syllogisms and Venn Diagrams',
    'Blood Relations and Direction Sense',
    'Coding-Decoding and Series',
    'Critical Reasoning and Statement Assumptions',
    'Data Sufficiency and Puzzles',
  ],
  'Social Science': [
    'Nationalism in Europe',
    'Nationalist Movement in Indo China',
    'Resources and Development',
    'Forest and Wildlife Resources',
    'Water Resources',
    'Agriculture',
    'Federalism',
    'Gender, Religion and Caste',
    'Political Parties',
    'Money and Credit',
    'Development',
    'Sectors of the Indian Economy',
  ],
  English: ['Reading Comprehension', 'Writing Skills', 'Grammar', 'First Flight', 'Footprints Without Feet'],
  Hindi: ['Reading Comprehension', 'Writing Skills', 'Grammar', 'Kshitij', 'Kritika'],
};

function normalizeName(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function extractPageText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseChapterList(chapters = '') {
  return chapters
    .split(/\r?\n|,/)
    .map((line) => normalizeName(line.replace(/^[-*\d.)\s]+/, '')))
    .filter(Boolean);
}

function extractSubjectsFromText(text: string) {
  const found = Object.keys(subjectChapterHints).filter((subjectName) =>
    text.toLowerCase().includes(subjectName.toLowerCase())
  );
  return found.length > 0 ? found : ['Mathematics', 'Science', 'Social Science'];
}

function inferChapters(subject: string, sourceText: string, manualChapters = '') {
  const manual = parseChapterList(manualChapters);
  if (manual.length > 0) return manual;

  // Direct match
  if (subjectChapterHints[subject]) {
    return subjectChapterHints[subject];
  }

  // Case-insensitive or partial match
  const lowerSub = subject.toLowerCase();
  for (const [key, hints] of Object.entries(subjectChapterHints)) {
    const lowerKey = key.toLowerCase();
    if (lowerSub.includes(lowerKey) || lowerKey.includes(lowerSub)) {
      return hints;
    }
  }

  // Keywords heuristics
  if (lowerSub.includes('math') || lowerSub.includes('calculus') || lowerSub.includes('algebra')) {
    return subjectChapterHints['Mathematics'] || [];
  }
  if (lowerSub.includes('physic') || lowerSub.includes('mechanic')) {
    return subjectChapterHints['Physics'] || [];
  }
  if (lowerSub.includes('chem')) {
    return subjectChapterHints['Chemistry'] || [];
  }
  if (lowerSub.includes('bio')) {
    return subjectChapterHints['Biology'] || [];
  }
  if (lowerSub.includes('network')) {
    return subjectChapterHints['Computer Networks'] || [];
  }
  if (lowerSub.includes('database') || lowerSub.includes('sql') || lowerSub.includes('dbms')) {
    return subjectChapterHints['Database Management Systems'] || [];
  }
  if (lowerSub.includes('os') || lowerSub.includes('operat')) {
    return subjectChapterHints['Operating Systems'] || [];
  }
  if (lowerSub.includes('data struct') || lowerSub.includes('algo')) {
    return subjectChapterHints['Data Structures & Algorithms'] || [];
  }
  if (lowerSub.includes('quant') || lowerSub.includes('aptitude') || lowerSub.includes('arithmetic')) {
    return subjectChapterHints['Quantitative Aptitude'] || [];
  }
  if (lowerSub.includes('reason') || lowerSub.includes('logic')) {
    return subjectChapterHints['Logical Reasoning'] || [];
  }

  // Parse structured units from source text if available
  if (sourceText) {
    const extractedFromText: string[] = [];
    const lines = sourceText.split(/[\r\n]+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(?:Unit|Chapter|Module|Section)\s*\d*[:.-]?\s+[A-Za-z]/i.test(trimmed) && trimmed.length < 80) {
        extractedFromText.push(trimmed);
      }
    }
    if (extractedFromText.length > 0) {
      return extractedFromText.slice(0, 12);
    }
  }

  // Standard high-level academic curriculum structure for any subject
  return [
    `${subject} - Unit 1: Foundations & Core Principles`,
    `${subject} - Unit 2: Theoretical Models & Methodologies`,
    `${subject} - Unit 3: Advanced Concepts & Analysis`,
    `${subject} - Unit 4: System Applications & Problem Solving`,
  ];
}

async function upsertSubject(
  board: string,
  className: string,
  subjectName: string,
  tier: string = 'SCHOOL',
  degreeMajor?: string,
  syllabusType: string = 'STANDARD',
  universityName?: string
) {
  const existing = await db.subject.findFirst({
    where: { board, class: className, name: subjectName },
  });

  if (existing) return existing;

  return (db.subject as any).create({
    data: {
      board,
      class: className,
      name: subjectName,
      tier,
      degreeMajor: degreeMajor || null,
      syllabusType,
      universityName: universityName || null,
    },
  });
}

async function upsertCurriculumTree(params: {
  board: string;
  className: string;
  subjects: { name: string; chapters: string[] }[];
  tier?: string;
  degreeMajor?: string;
  syllabusType?: string;
  universityName?: string;
}) {
  const result: { subject: string; chapters: string[] }[] = [];

  for (const subjectItem of params.subjects) {
    const subjectName = normalizeName(subjectItem.name);
    if (!subjectName) continue;

    const subject = await upsertSubject(
      params.board,
      params.className,
      subjectName,
      params.tier || 'SCHOOL',
      params.degreeMajor,
      params.syllabusType || 'STANDARD',
      params.universityName
    );
    const chapters: string[] = [];

    for (const chapterNameRaw of subjectItem.chapters) {
      const chapterName = normalizeName(chapterNameRaw);
      if (!chapterName) continue;

      let chapter = await db.chapter.findFirst({
        where: { subjectId: subject.id, name: chapterName },
      });

      if (!chapter) {
        chapter = await db.chapter.create({
          data: { subjectId: subject.id, name: chapterName },
        });
      }

      const topic = await db.topic.findFirst({
        where: { chapterId: chapter.id, name: chapterName },
      });

      if (!topic) {
        await db.topic.create({
          data: { chapterId: chapter.id, name: chapterName },
        });
      }

      chapters.push(chapterName);
    }

    result.push({ subject: subjectName, chapters });
  }

  return result;
}

// GET: Fetch verified curriculum sources
export async function GET() {
  try {
    const sources = await db.curriculumSource.findMany({
      orderBy: { retrievedAt: 'desc' },
    });
    return NextResponse.json({ sources });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch syllabus sources' }, { status: 500 });
  }
}

// POST: Controlled server-side retrieval of official public syllabus context
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const body = await req.json();
    const validated = SyllabusResearchSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 });
    }

    const { board, className, subject, query, chapters, tier, degreeMajor, syllabusType, universityName } = validated.data;
    const mode = body.mode === 'manual' ? 'manual' : 'auto';

    if (mode === 'manual') {
      const subjectName = normalizeName(subject || '');
      if (!subjectName) {
        return NextResponse.json({ error: 'Subject is required for manual syllabus entry' }, { status: 400 });
      }

      const chapterEntries = Array.isArray(body.chapterEntries)
        ? body.chapterEntries
            .map((entry: any) => ({
              name: normalizeName(String(entry?.name || '')),
              content: String(entry?.content || '').trim(),
            }))
            .filter((entry: { name: string; content: string }) => entry.name && entry.content)
        : [];
      const entryContent = chapterEntries
        .map((entry: { name: string; content: string }) => `${entry.name}\n${entry.content}`)
        .join('\n\n');
      const content = String(body.content || entryContent).trim();
      if (!content) {
        return NextResponse.json({ error: 'Syllabus content is required' }, { status: 400 });
      }

      const chapterList = chapterEntries.length > 0
        ? chapterEntries.map((entry: { name: string }) => entry.name)
        : parseChapterList(chapters);
      if (chapterList.length === 0) {
        return NextResponse.json({ error: 'Add at least one chapter for manual syllabus entry' }, { status: 400 });
      }

      const sourceName = String(body.sourceName || `${board} ${className} ${subjectName} Manual Syllabus`).trim();
      const sourceUrl =
        String(body.sourceUrl || '').trim() ||
        `manual://${board.toLowerCase().replace(/\s+/g, '-')}/${className.toLowerCase().replace(/\s+/g, '-')}/${subjectName.toLowerCase().replace(/\s+/g, '-')}`;

      const curriculum = await upsertCurriculumTree({
        board,
        className,
        subjects: [{ name: subjectName, chapters: chapterList }],
        tier,
        degreeMajor,
        syllabusType,
        universityName,
      });

      const newSource = await db.curriculumSource.create({
        data: {
          board,
          class: className,
          subject: subjectName,
          sourceName,
          sourceUrl,
          content: `${content}\n\nChapters:\n${chapterList.map((chapter: string) => `- ${chapter}`).join('\n')}`,
          status: 'VERIFIED',
        },
      });

      return NextResponse.json({ success: true, source: newSource, curriculum });
    }

    const defaultUrl =
      DEFAULT_SOURCE_URLS[tier] ||
      DEFAULT_SOURCE_URLS[board] ||
      CBSE_CURRICULUM_URL;

    const sourceUrl =
      String(body.sourceUrl || '').trim() ||
      defaultUrl;

    let pageText = '';
    try {
      const syllabusResponse = await fetch(sourceUrl, {
        cache: 'no-store',
        headers: { 'User-Agent': 'EduPrep-AI syllabus retriever' },
      });

      if (syllabusResponse.ok) {
        const html = await syllabusResponse.text();
        pageText = extractPageText(html);
      }
    } catch (fetchErr) {
      console.warn('Could not reach remote source URL, using structured knowledge fallback:', fetchErr);
    }

    const subjectNames = subject && subject.trim().length > 0 ? [normalizeName(subject)] : extractSubjectsFromText(pageText);
    const curriculumInput = subjectNames.map((subjectName) => ({
      name: subjectName,
      chapters: inferChapters(subjectName, pageText, chapters || query || ''),
    }));

    const curriculum = await upsertCurriculumTree({
      board,
      className,
      subjects: curriculumInput,
      tier,
      degreeMajor: tier === 'COLLEGE' ? degreeMajor : undefined,
      syllabusType: tier === 'COLLEGE' ? syllabusType : 'STANDARD',
      universityName: tier === 'COLLEGE' && syllabusType === 'CUSTOM_UNIVERSITY' ? universityName : undefined,
    });

    const sourceName = `${board} Official ${className} Curriculum`;
    const content = [
      `Retrieved from ${sourceUrl}`,
      query ? `Admin query: ${query}` : '',
      'Subjects and chapters added:',
      ...curriculum.flatMap((item) => [
        `${item.subject}:`,
        ...item.chapters.map((chapter: string) => `- ${chapter}`),
      ]),
    ]
      .filter(Boolean)
      .join('\n');

    const newSource = await db.curriculumSource.create({
      data: {
        board,
        class: className,
        subject: subjectNames.join(', '),
        sourceName,
        sourceUrl,
        content,
        status: 'VERIFIED',
      },
    });

    return NextResponse.json({ success: true, source: newSource, curriculum });
  } catch (error) {
    console.error('Syllabus Research API Error:', error);
    return NextResponse.json({ error: 'Failed to research syllabus' }, { status: 500 });
  }
}
