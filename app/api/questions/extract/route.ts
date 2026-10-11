import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { extractQuestionsFromTextOrImage } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const body = await req.json();
    const { rawText, topicId, context } = body;

    if (!rawText || rawText.trim() === '') {
      return NextResponse.json({ error: 'Raw text or image content required for extraction' }, { status: 400 });
    }

    let topicContext = context;
    if (topicId) {
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
        return NextResponse.json({ error: 'Selected syllabus topic was not found' }, { status: 404 });
      }

      topicContext = {
        subjectName: topic.chapter.subject.name,
        chapterName: topic.chapter.name,
        topicName: topic.name,
      };
    }

    const extractionResult = await extractQuestionsFromTextOrImage(rawText, topicContext);

    // Save ExtractedQuestion record for admin audit
    const savedJob = await db.extractedQuestion.create({
      data: {
        rawExtractedText: rawText,
        status: 'PENDING',
        createdById: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: savedJob.id,
      extractedQuestions: extractionResult.questions,
      isFallback: extractionResult.isFallback,
    });
  } catch (error) {
    console.error('Question Extraction API Error:', error);
    return NextResponse.json({ error: 'Failed to extract questions from image/text' }, { status: 500 });
  }
}
