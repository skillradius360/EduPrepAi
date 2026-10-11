import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedTier = searchParams.get('tier');
    const requestedClass = searchParams.get('class');
    const requestedDegreeMajor = searchParams.get('degreeMajor');
    const enforceUserFilter = searchParams.get('enforceUser') === 'true';

    const currentUser = await getCurrentUser();

    let whereClause: any = {};

    if (requestedTier) {
      const upperTier = requestedTier.toUpperCase();
      if (upperTier === 'SCHOOL') {
        whereClause.OR = [{ tier: 'SCHOOL' }, { tier: null }, { tier: 'school' }];
      } else {
        whereClause.tier = upperTier;
      }
      if (requestedClass) {
        whereClause.class = { equals: requestedClass, mode: 'insensitive' };
      }
      if (requestedDegreeMajor) {
        whereClause.degreeMajor = { contains: requestedDegreeMajor, mode: 'insensitive' };
      }
    } else if (enforceUserFilter && currentUser && (currentUser.role || '').toUpperCase() === 'STUDENT') {
      const studentTier = (currentUser.institutionType || 'SCHOOL').toUpperCase();
      if (studentTier === 'SCHOOL') {
        whereClause.OR = [{ tier: 'SCHOOL' }, { tier: null }, { tier: 'school' }];
        if (currentUser.class) {
          whereClause.class = { equals: currentUser.class, mode: 'insensitive' };
        }
      } else if (studentTier === 'COLLEGE') {
        whereClause.tier = 'COLLEGE';
        if (currentUser.degreeMajor) {
          whereClause.degreeMajor = { contains: currentUser.degreeMajor, mode: 'insensitive' };
        }
      } else if (studentTier === 'COMPETITIVE') {
        whereClause.tier = 'COMPETITIVE';
      }
    }

    let subjects = await db.subject.findMany({
      where: whereClause,
      include: {
        chapters: {
          include: {
            topics: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });


    return NextResponse.json({
      subjects,
      userProfile: currentUser
        ? {
            role: currentUser.role,
            institutionType: currentUser.institutionType,
            class: currentUser.class,
            board: currentUser.board,
            degreeMajor: currentUser.degreeMajor,
            universityName: currentUser.universityName,
            semester: currentUser.semester,
          }
        : null,
    });
  } catch (error) {
    console.error('Curriculum API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch curriculum data' }, { status: 500 });
  }
}
