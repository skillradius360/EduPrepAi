import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ManualQuestionSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const body = await req.json();
    const validated = ManualQuestionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Verify topic existence
    const topic = await db.topic.findUnique({
      where: { id: data.topicId },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Invalid topic selected.' }, { status: 404 });
    }

    const question = await (db.question as any).create({
      data: {
        topicId: data.topicId,
        questionText: data.questionText,
        questionType: data.questionType,
        optionA: data.questionType === 'MCQ' ? data.optionA || null : null,
        optionB: data.questionType === 'MCQ' ? data.optionB || null : null,
        optionC: data.questionType === 'MCQ' ? data.optionC || null : null,
        optionD: data.questionType === 'MCQ' ? data.optionD || null : null,
        correctAnswer: data.questionType === 'MCQ' ? data.correctAnswer ?? 0 : null,
        expectedAnswer: data.questionType !== 'MCQ' ? data.expectedAnswer || null : null,
        markingScheme: data.questionType !== 'MCQ' ? data.markingScheme || null : null,
        explanation: data.explanation,
        difficulty: data.difficulty,
        marks: data.marks ?? (data.questionType === 'MCQ' ? 1 : data.questionType === 'SHORT_2_MARK' ? 2 : data.questionType === 'NAT' ? 2 : 5),
        source: data.paperYear ? 'PYQ' : data.isProbableFuture ? 'PREDICTED_FUTURE' : 'MANUAL',
        sourceType: 'ADMIN',
        status: 'PENDING', // Saved as PENDING so it enters the question queue for review
        examName: data.examName || null,
        paperYear: data.paperYear || null,
        paperSession: data.paperSession || null,
        isProbableFuture: Boolean(data.isProbableFuture),
        predictionRationale: data.predictionRationale || null,
        createdById: user.id,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Manual Question POST API Error:', error);
    return NextResponse.json({ error: 'Failed to create manual question' }, { status: 500 });
  }
}
