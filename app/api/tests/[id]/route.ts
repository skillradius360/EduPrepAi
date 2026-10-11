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

    const testId = params.id;
    const test = await db.test.findUnique({
      where: { id: testId },
      include: {
        subject: true,
        topic: true,
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

    return NextResponse.json({ test });
  } catch (error) {
    console.error('Fetch Test API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}
