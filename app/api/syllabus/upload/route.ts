import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function parseSyllabusText(text: string): { subjectName: string; chapters: { name: string; topics: string[] }[] }[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsedSubjects: { subjectName: string; chapters: { name: string; topics: string[] }[] }[] = [];
  let currentSubject: { subjectName: string; chapters: { name: string; topics: string[] }[] } | null = null;
  let currentChapter: { name: string; topics: string[] } | null = null;

  for (const rawLine of lines) {
    // Subject header detection: e.g. "Subject: Data Structures" or "Subject - Data Structures" or "# Data Structures"
    if (/^(subject\s*[:\-]|#\s+)/i.test(rawLine)) {
      const subjectName = rawLine.replace(/^(subject\s*[:\-]|#\s+)/i, '').trim();
      currentSubject = { subjectName, chapters: [] };
      parsedSubjects.push(currentSubject);
      currentChapter = null;
      continue;
    }

    // Chapter header detection: e.g. "Chapter: Arrays" or "Unit 1: Stacks" or "Module 1:" or "## Stacks"
    if (/^(chapter|unit|module)\s*[\d.:\-]*\s*/i.test(rawLine) || /^##\s+/i.test(rawLine)) {
      const chapterName = rawLine.replace(/^(chapter|unit|module)\s*[\d.:\-]*\s*/i, '').replace(/^##\s+/, '').trim();
      if (!currentSubject) {
        currentSubject = { subjectName: 'General Studies', chapters: [] };
        parsedSubjects.push(currentSubject);
      }
      currentChapter = { name: chapterName || 'Unit 1', topics: [] };
      currentSubject.chapters.push(currentChapter);
      continue;
    }

    // Topic detection: e.g. bullet points like "- Binary Trees", "* Stacks", "1. Queues"
    if (/^[-*•\d+.)\s]+/.test(rawLine)) {
      const topicName = rawLine.replace(/^[-*•\d+.)\s]+/, '').trim();
      if (topicName) {
        if (!currentSubject) {
          currentSubject = { subjectName: 'Custom Syllabus Subject', chapters: [] };
          parsedSubjects.push(currentSubject);
        }
        if (!currentChapter) {
          currentChapter = { name: 'Module 1 - Core Foundations', topics: [] };
          currentSubject.chapters.push(currentChapter);
        }
        currentChapter.topics.push(topicName);
        continue;
      }
    }

    // If it's a standalone line without formatting
    if (rawLine.length > 2) {
      if (!currentSubject) {
        currentSubject = { subjectName: rawLine, chapters: [] };
        parsedSubjects.push(currentSubject);
      } else if (!currentChapter) {
        currentChapter = { name: rawLine, topics: [] };
        currentSubject.chapters.push(currentChapter);
      } else {
        currentChapter.topics.push(rawLine);
      }
    }
  }

  return parsedSubjects;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      syllabusText,
      scopeType, // 'WHOLE_YEAR' or 'SEMESTER'
      semester,  // e.g. 1 to 8
      academicYear, // e.g. "1st Year", "2nd Year"
      subjectName: providedSubjectName,
    } = body;

    if (!syllabusText || syllabusText.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide syllabus text to upload.' }, { status: 400 });
    }

    const parsedSubjects = parseSyllabusText(syllabusText);

    if (parsedSubjects.length === 0) {
      return NextResponse.json({
        error: 'Unable to extract structured subjects/chapters from the provided text. Please format with Subject, Chapter, and Topic lines.',
      }, { status: 400 });
    }

    const createdItems: any[] = [];
    const studentTier = user.institutionType || 'COLLEGE';
    const userMajor = user.degreeMajor || 'Undergraduate Studies';
    const userUniv = user.universityName || 'Student Affiliated University';

    for (const item of parsedSubjects) {
      const subjectTitle = providedSubjectName || item.subjectName;

      // Find or create subject tailored to student's program
      let subject = await db.subject.findFirst({
        where: {
          name: subjectTitle,
          tier: studentTier,
          degreeMajor: userMajor,
          semester: semester ? Number(semester) : null,
        },
      });

      if (!subject) {
        subject = await (db.subject as any).create({
          data: {
            name: subjectTitle,
            class: studentTier === 'COLLEGE' ? 'UG/PG' : studentTier === 'COMPETITIVE' ? 'Entrance' : (user.class || 'Class 10'),
            board: userUniv,
            tier: studentTier,
            degreeMajor: userMajor,
            syllabusType: 'CUSTOM_UNIVERSITY',
            universityName: userUniv,
            semester: semester ? Number(semester) : null,
          },
        });
      }

      if (!subject) continue;

      // Add chapters & topics
      for (const ch of item.chapters) {
        let chapter = await db.chapter.findFirst({
          where: { subjectId: subject.id, name: ch.name },
        });

        if (!chapter) {
          chapter = await db.chapter.create({
            data: {
              name: ch.name,
              subjectId: subject.id,
            },
          });
        }

        const topicsToAdd = ch.topics.length > 0 ? ch.topics : ['General Concepts', 'Core Principles'];
        for (const tpName of topicsToAdd) {
          const existingTopic = await db.topic.findFirst({
            where: { chapterId: chapter.id, name: tpName },
          });

          if (!existingTopic) {
            await db.topic.create({
              data: {
                name: tpName,
                chapterId: chapter.id,
              },
            });
          }
        }
      }

      createdItems.push({
        subjectId: subject.id,
        subjectName: subject.name,
        chaptersCount: item.chapters.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed and added syllabus for ${scopeType === 'SEMESTER' ? `Semester ${semester}` : (academicYear || 'Academic Year')}!`,
      createdSubjects: createdItems,
    });
  } catch (error) {
    console.error('Syllabus Upload API Error:', error);
    return NextResponse.json({ error: 'Failed to upload and parse syllabus.' }, { status: 500 });
  }
}
