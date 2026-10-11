import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attempts = await db.attempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: {
        test: {
          include: {
            subject: true,
            topic: true,
          },
        },
      },
    });

    if (attempts.length === 0) {
      return NextResponse.json({
        hasData: false,
        scoreTrend: [],
        topicPerformance: [],
        overallStats: {
          testsAttempted: 0,
          averageScore: 0,
          bestScore: 0,
          totalQuestions: 0,
          accuracy: 0,
        },
      });
    }

    // 1. Score trend data for line chart
    const scoreTrend = attempts.map((att, idx) => ({
      attemptNumber: idx + 1,
      date: new Date(att.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      }),
      score: att.percentage,
      testTitle: att.test.title,
      topicName: att.test.topic.name,
    }));

    // 2. Topic performance grouping for bar chart
    const topicStats: Record<string, { totalPercentage: number; count: number; subject: string }> = {};

    attempts.forEach((att) => {
      const topicName = att.test.topic.name;
      const subjectName = att.test.subject.name;

      if (!topicStats[topicName]) {
        topicStats[topicName] = { totalPercentage: 0, count: 0, subject: subjectName };
      }
      topicStats[topicName].totalPercentage += att.percentage;
      topicStats[topicName].count += 1;
    });

    const topicPerformance = Object.keys(topicStats).map((topicName) => {
      const stat = topicStats[topicName];
      const avgAccuracy = Math.round(stat.totalPercentage / stat.count);
      return {
        topic: topicName,
        subject: stat.subject,
        accuracy: avgAccuracy,
      };
    });

    // 3. Summary stats
    const totalTests = attempts.length;
    const totalScoreSum = attempts.reduce((acc, curr) => acc + curr.percentage, 0);
    const averageScore = Math.round(totalScoreSum / totalTests);
    const bestScore = Math.max(...attempts.map((a) => a.percentage));

    const totalQuestions = attempts.reduce((acc, curr) => acc + curr.totalQuestions, 0);
    const totalCorrect = attempts.reduce((acc, curr) => acc + curr.correctAnswers, 0);
    const accuracy = Math.round((totalCorrect / (totalQuestions || 1)) * 100);

    return NextResponse.json({
      hasData: true,
      scoreTrend,
      topicPerformance,
      overallStats: {
        testsAttempted: totalTests,
        averageScore,
        bestScore,
        totalQuestions,
        accuracy,
      },
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
