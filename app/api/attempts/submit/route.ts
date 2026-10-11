import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { SubmitTestSchema } from '@/lib/validation';
import { evaluateDescriptiveAnswer } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = SubmitTestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { testId, answers, timeTaken } = validated.data;

    const test = await db.test.findUnique({
      where: { id: testId },
      include: {
        testQuestions: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    let totalAwardedMarks = 0;
    let totalMaxMarks = 0;
    let correctCount = 0;
    const answerRecords = [];

    for (const item of test.testQuestions) {
      const q = item.question;
      const qMarks = q.marks || (q.questionType === 'MCQ' ? 1 : q.questionType === 'SHORT_2_MARK' ? 2 : 5);
      totalMaxMarks += qMarks;

      const userSubmission = answers.find((a) => a.questionId === q.id);
      const selected = userSubmission ? userSubmission.selectedAnswer : null;
      const textAns = userSubmission ? userSubmission.textAnswer : '';

      if (q.questionType === 'MCQ') {
        const isCorrect = selected !== null && selected !== undefined && selected === q.correctAnswer;
        const awarded = isCorrect ? qMarks : 0;
        if (isCorrect) correctCount += 1;

        totalAwardedMarks += awarded;

        answerRecords.push({
          questionId: q.id,
          selectedAnswer: selected ?? -1,
          textAnswer: null,
          awardedMarks: awarded,
          maxMarks: qMarks,
          isCorrect,
          evaluationType: 'OBJECTIVE',
          feedback: isCorrect ? 'Correct option selected!' : 'Incorrect option selected.',
        });
      } else if (q.questionType === 'NAT') {
        // Numerical Answer Type (GATE / CAT): Exact or float tolerance check
        const cleanStudentVal = parseFloat(String(textAns || '').trim());
        const cleanExpectedVal = parseFloat(String(q.expectedAnswer || '').trim());

        let isNatCorrect = false;
        if (!isNaN(cleanStudentVal) && !isNaN(cleanExpectedVal)) {
          isNatCorrect = Math.abs(cleanStudentVal - cleanExpectedVal) <= 0.05;
        } else {
          isNatCorrect = String(textAns || '').trim().toLowerCase() === String(q.expectedAnswer || '').trim().toLowerCase();
        }

        const awarded = isNatCorrect ? qMarks : 0;
        if (isNatCorrect) correctCount += 1;

        totalAwardedMarks += awarded;

        answerRecords.push({
          questionId: q.id,
          selectedAnswer: null,
          textAnswer: textAns || '',
          awardedMarks: awarded,
          maxMarks: qMarks,
          isCorrect: isNatCorrect,
          evaluationType: 'OBJECTIVE',
          feedback: isNatCorrect
            ? `Correct numerical value! (${cleanStudentVal})`
            : `Incorrect value. Expected: ${q.expectedAnswer || 'N/A'}`,
        });
      } else {
        // Descriptive 2-Mark or 5-Mark evaluation via AI
        const evaluation = await evaluateDescriptiveAnswer({
          questionText: q.questionText,
          studentAnswer: textAns || '',
          expectedAnswer: q.expectedAnswer || undefined,
          markingScheme: q.markingScheme || undefined,
          maxMarks: qMarks,
        });

        const isPassing = evaluation.awardedMarks >= qMarks * 0.6;
        if (isPassing) correctCount += 1;

        totalAwardedMarks += evaluation.awardedMarks;

        answerRecords.push({
          questionId: q.id,
          selectedAnswer: null,
          textAnswer: textAns || '',
          awardedMarks: evaluation.awardedMarks,
          maxMarks: qMarks,
          isCorrect: isPassing,
          evaluationType: 'AI_ASSISTED',
          feedback: evaluation.feedback,
        });
      }
    }

    const totalQuestions = test.testQuestions.length;
    const percentage = Math.round((totalAwardedMarks / (totalMaxMarks || 1)) * 100 * 10) / 10;

    // Save Attempt and AttemptAnswers in database
    const attempt = await db.attempt.create({
      data: {
        userId: user.id,
        testId: test.id,
        score: Math.round(totalAwardedMarks * 10) / 10,
        totalMarks: totalMaxMarks,
        percentage,
        correctAnswers: correctCount,
        totalQuestions,
        timeTaken,
        answers: {
          create: answerRecords,
        },
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score: attempt.score,
      totalMarks: totalMaxMarks,
      percentage,
      correctAnswers: correctCount,
      totalQuestions,
      timeTaken,
    });
  } catch (error) {
    console.error('Submit Attempt API Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit test' },
      { status: 500 }
    );
  }
}
