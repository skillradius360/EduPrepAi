import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subjects = await db.subject.findMany({
      select: {
        tier: true,
        class: true,
        board: true,
        degreeMajor: true,
        universityName: true,
        name: true,
      },
    });

    const schoolClasses = Array.from(
      new Set(
        subjects
          .filter((s) => (s.tier || 'SCHOOL').toUpperCase() === 'SCHOOL')
          .map((s) => s.class)
          .filter(Boolean)
      )
    ).sort();

    const schoolBoards = Array.from(
      new Set(
        subjects
          .filter((s) => (s.tier || 'SCHOOL').toUpperCase() === 'SCHOOL')
          .map((s) => s.board)
          .filter(Boolean)
      )
    ).sort();

    const collegeMajors = Array.from(
      new Set(
        subjects
          .filter((s) => (s.tier || '').toUpperCase() === 'COLLEGE')
          .map((s) => s.degreeMajor)
          .filter(Boolean)
      )
    ).sort();

    const universities = Array.from(
      new Set(
        subjects
          .filter((s) => (s.tier || '').toUpperCase() === 'COLLEGE')
          .map((s) => s.universityName)
          .filter(Boolean)
      )
    ).sort();

    const competitiveExams = Array.from(
      new Set(
        subjects
          .filter((s) => (s.tier || '').toUpperCase() === 'COMPETITIVE')
          .map((s) => {
            // E.g. "Computer Networks (GATE CS)" or class/name
            const match = s.name.match(/\((.*?)\)/);
            return match ? match[1] : s.name;
          })
          .filter(Boolean)
      )
    ).sort();

    return NextResponse.json({
      success: true,
      options: {
        schoolClasses,
        schoolBoards,
        collegeMajors,
        universities,
        competitiveExams,
      },
    });
  } catch (error) {
    console.error('Options API Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve curriculum options' }, { status: 500 });
  }
}
