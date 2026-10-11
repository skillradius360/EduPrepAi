import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attemptId = params.id;
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            subject: true,
            topic: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    return NextResponse.json({ attempt });
  } catch (error) {
    console.error('Fetch Attempt API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch attempt details' }, { status: 500 });
  }
}
