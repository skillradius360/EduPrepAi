import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { GenerateQuestionsSchema } from '@/lib/validation';
import { generateQuestionsWithGemini } from '@/lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('[EduPrep AI API] Received question generation request:', body);

    const validated = GenerateQuestionsSchema.safeParse(body);

    if (!validated.success) {
      console.warn('[EduPrep AI API] Request validation failed:', validated.error.errors[0].message);
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      tier,
      exam,
      classLevel,
      board,
      degreeMajor,
      syllabusType,
      universityName,
      semester,
      generationMode,
      examName,
      targetYear,
      subjectId,
      chapterId,
      topicId,
      difficulty,
      questionType,
      count,
      numberOfQuestions,
      syllabusContext,
    } = validated.data;

    // Fetch entity names for AI context
    const topic = await db.topic.findUnique({
      where: { id: topicId },
      include: {
        chapter: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!topic) {
      console.warn('[EduPrep AI API] Topic not found for topicId:', topicId);
      return NextResponse.json({ error: 'Invalid topic selected.' }, { status: 404 });
    }

    const qCount = numberOfQuestions || count || 5;

    const effectiveTier = tier || topic.chapter.subject.tier || 'SCHOOL';
    const effectiveExamName = examName || (effectiveTier === 'COMPETITIVE' ? exam : undefined);
    const effectiveDegreeMajor = degreeMajor || topic.chapter.subject.degreeMajor || undefined;
    const effectiveSyllabusType = syllabusType || topic.chapter.subject.syllabusType || 'STANDARD';

    const aiResult = await generateQuestionsWithGemini({
      tier: effectiveTier,
      exam: exam || 'CBSE',
      classLevel: classLevel || user.class || 'Class 10',
      board: board || user.board || 'CBSE',
      degreeMajor: effectiveDegreeMajor,
      syllabusType: effectiveSyllabusType,
      universityName: universityName || topic.chapter.subject.universityName || undefined,
      semester: semester || topic.chapter.subject.semester || undefined,
      generationMode: generationMode || 'STANDARD',
      examName: effectiveExamName,
      targetYear,
      subjectName: topic.chapter.subject.name,
      chapterName: topic.chapter.name,
      topicName: topic.name,
      topicId: topic.id,
      difficulty,
      questionType,
      numberOfQuestions: qCount,
      syllabusContext,
    });

    const outputQuestions = [];

    if (aiResult.isFallback) {
      return NextResponse.json({
        success: true,
        questions: aiResult.questions,
        isFallback: true,
        message: aiResult.message,
        topicName: topic.name,
        subjectName: topic.chapter.subject.name,
      });
    }

    // Save live AI questions.
    for (const q of aiResult.questions) {
      try {
        const created = await (db.question as any).create({
          data: {
            questionText: q.questionText,
            questionType: q.questionType || questionType || 'MCQ',
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            expectedAnswer: q.expectedAnswer,
            markingScheme: q.markingScheme,
            explanation: q.explanation,
            difficulty: q.difficulty || difficulty,
            marks: q.marks || (q.questionType === 'MCQ' ? 1 : q.questionType === 'SHORT_2_MARK' ? 2 : q.questionType === 'NAT' ? 2 : 5),
            topicId: topic.id,
            source: generationMode === 'PYQ' ? 'PYQ' : generationMode === 'FUTURE_PROBABLE' ? 'PREDICTED_FUTURE' : 'AI',
            sourceType: generationMode === 'PYQ' ? 'PYQ' : generationMode === 'FUTURE_PROBABLE' ? 'PROBABLE_PREDICTION' : 'AI',
            status: 'PENDING',
            examName: q.examName || effectiveExamName || null,
            paperYear: q.paperYear || targetYear || null,
            paperSession: q.paperSession || null,
            isProbableFuture: Boolean(q.isProbableFuture || generationMode === 'FUTURE_PROBABLE'),
            predictionRationale: q.predictionRationale || null,
            createdById: user.id,
          },
        });
        outputQuestions.push(created);
      } catch (dbErr) {
        console.error('[EduPrep AI API] Database save error for question, returning transient question object:', dbErr);
        outputQuestions.push({
          id: `temp-${Math.random().toString(36).substring(2, 9)}`,
          questionText: q.questionText,
          questionType: q.questionType || questionType || 'MCQ',
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          expectedAnswer: q.expectedAnswer,
          markingScheme: q.markingScheme,
          explanation: q.explanation,
          difficulty: q.difficulty || difficulty,
          marks: q.marks || (q.questionType === 'MCQ' ? 1 : q.questionType === 'SHORT_2_MARK' ? 2 : q.questionType === 'NAT' ? 2 : 5),
          topicId: topic.id,
          examName: q.examName || effectiveExamName || null,
          paperYear: q.paperYear || targetYear || null,
          isProbableFuture: Boolean(q.isProbableFuture || generationMode === 'FUTURE_PROBABLE'),
          predictionRationale: q.predictionRationale || null,
        });
      }
    }

    console.log(`[EduPrep AI API] Returning ${outputQuestions.length} questions to frontend UI.`);

    return NextResponse.json({
      success: true,
      questions: outputQuestions,
      isFallback: aiResult.isFallback,
      message: aiResult.message,
      topicName: topic.name,
      subjectName: topic.chapter.subject.name,
    });
  } catch (error: any) {
    console.error('[EduPrep AI API] Gemini Question Generation Route Exception:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate questions. Please try again.' },
      { status: 500 }
    );
  }
}
