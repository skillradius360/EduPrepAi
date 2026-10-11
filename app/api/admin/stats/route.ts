import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [totalStudents, totalSubjects, totalTopics, totalQuestions, totalAttempts, pendingQuestionsCount] =
      await Promise.all([
        db.user.count({ where: { role: 'STUDENT' } }),
        db.subject.count(),
        db.topic.count(),
        db.question.count(),
        db.attempt.count(),
        db.question.count({ where: { status: 'PENDING' } }),
      ]);

    return NextResponse.json({
      stats: {
        totalStudents,
        totalSubjects,
        totalTopics,
        totalQuestions,
        totalAttempts,
        pendingQuestionsCount,
      },
    });
  } catch (error) {
    console.error('Admin Stats API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
