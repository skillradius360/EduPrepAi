import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export interface TopicRecommendation {
  topicId: string;
  topicName: string;
  subjectName: string;
  chapterName: string;
  accuracy: number;
  status: 'WEAK' | 'MODERATE' | 'STRONG';
  recommendationText: string;
  suggestedAction: string;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch student's attempt history
    const attempts = await db.attempt.findMany({
      where: { userId: user.id },
      include: {
        test: {
          include: {
            subject: true,
            topic: {
              include: {
                chapter: true,
              },
            },
          },
        },
      },
    });

    if (attempts.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: 'No test attempts found yet. Complete a practice test to unlock personalized recommendations!',
      });
    }

    // Group scores by topic
    const topicData: Record<
      string,
      {
        topicId: string;
        topicName: string;
        subjectName: string;
        chapterName: string;
        scores: number[];
      }
    > = {};

    attempts.forEach((att) => {
      const top = att.test.topic;
      const sub = att.test.subject;
      const ch = top.chapter;

      if (!topicData[top.id]) {
        topicData[top.id] = {
          topicId: top.id,
          topicName: top.name,
          subjectName: sub.name,
          chapterName: ch.name,
          scores: [],
        };
      }
      topicData[top.id].scores.push(att.score);
    });

    const recommendations: TopicRecommendation[] = Object.values(topicData).map((item) => {
      const avgScore = Math.round(item.scores.reduce((a, b) => a + b, 0) / item.scores.length);

      let status: 'WEAK' | 'MODERATE' | 'STRONG' = 'MODERATE';
      let recommendationText = '';
      let suggestedAction = '';

      if (avgScore < 60) {
        status = 'WEAK';
        recommendationText = `Your accuracy in ${item.topicName} is ${avgScore}%. Revise the fundamental concepts in ${item.chapterName} and attempt 5 easy questions before attempting timed mock tests.`;
        suggestedAction = `Practice ${item.topicName} (Easy)`;
      } else if (avgScore <= 80) {
        status = 'MODERATE';
        recommendationText = `You have a moderate understanding of ${item.topicName} (${avgScore}% accuracy). Practice medium-level numericals and conceptual problems to boost your mastery.`;
        suggestedAction = `Practice ${item.topicName} (Medium)`;
      } else {
        status = 'STRONG';
        recommendationText = `Excellent performance in ${item.topicName} with ${avgScore}% accuracy! Try advanced questions or challenge yourself on another topic.`;
        suggestedAction = `Take Advanced Test on ${item.topicName}`;
      }

      return {
        topicId: item.topicId,
        topicName: item.topicName,
        subjectName: item.subjectName,
        chapterName: item.chapterName,
        accuracy: avgScore,
        status,
        recommendationText,
        suggestedAction,
      };
    });

    // Sort: WEAK topics first, then MODERATE, then STRONG
    recommendations.sort((a, b) => a.accuracy - b.accuracy);

    const weakTopics = recommendations.filter((r) => r.status === 'WEAK');

    return NextResponse.json({
      recommendations,
      weakTopics,
      hasData: true,
    });
  } catch (error) {
    console.error('Recommendations API Error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
