import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subjectId, topicId, title, duration, questionIds } = body;

    if (!subjectId || !topicId || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Invalid test creation parameters.' }, { status: 400 });
    }

    const questions = await db.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, marks: true },
    });
    const questionMarksById = new Map(questions.map((q) => [q.id, q.marks || 1]));
    const totalMarks = questionIds.reduce((sum: number, qId: string) => sum + (questionMarksById.get(qId) || 1), 0);

    const test = await db.test.create({
      data: {
        title: title || 'Practice Test',
        subjectId,
        topicId,
        totalQuestions: questionIds.length,
        totalMarks,
        duration: duration || 10,
        testQuestions: {
          create: questionIds.map((qId: string, index: number) => ({
            questionId: qId,
            marks: questionMarksById.get(qId) || 1,
            order: index + 1,
          })),
        },
      },
      include: {
        testQuestions: {
          include: {
            question: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, testId: test.id, test });
  } catch (error) {
    console.error('Test Creation API Error:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}
