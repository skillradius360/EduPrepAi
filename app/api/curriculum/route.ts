import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedTier = searchParams.get('tier');
    const requestedClass = searchParams.get('class');
    const requestedDegreeMajor = searchParams.get('degreeMajor');
    const enforceUserFilter = searchParams.get('enforceUser') === 'true';

    const currentUser = await getCurrentUser();

    let whereClause: any = {};

    // Helper: build a class filter that matches "Class 10", "10", "class10" etc.
    const buildClassFilter = (cls: string) => {
      const num = cls.replace(/\D/g, ''); // extract digits e.g. "10"
      return num
        ? { OR: [
            { class: { contains: cls, mode: 'insensitive' } },
            { class: { contains: num, mode: 'insensitive' } },
          ]}
        : { class: { contains: cls, mode: 'insensitive' } };
    };

    if (requestedTier) {
      const upperTier = requestedTier.toUpperCase();
      const tierOR = upperTier === 'SCHOOL'
        ? [{ tier: 'SCHOOL' }, { tier: null }, { tier: 'school' }]
        : [{ tier: upperTier }];
      const andConditions: any[] = [{ OR: tierOR }];
      if (requestedClass) {
        andConditions.push(buildClassFilter(requestedClass));
      }
      if (requestedDegreeMajor) {
        andConditions.push({ degreeMajor: { contains: requestedDegreeMajor, mode: 'insensitive' } });
      }
      whereClause = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };
    } else if (enforceUserFilter && currentUser && (currentUser.role || '').toUpperCase() === 'STUDENT') {
      const studentTier = (currentUser.institutionType || 'SCHOOL').toUpperCase();
      if (studentTier === 'SCHOOL') {
        const andConditions: any[] = [{ OR: [{ tier: 'SCHOOL' }, { tier: null }, { tier: 'school' }] }];
        if (currentUser.class) {
          andConditions.push(buildClassFilter(currentUser.class));
        }
        whereClause = { AND: andConditions };
      } else if (studentTier === 'COLLEGE') {
        const andConditions: any[] = [{ tier: 'COLLEGE' }];
        if (currentUser.degreeMajor) {
          andConditions.push({ degreeMajor: { contains: currentUser.degreeMajor, mode: 'insensitive' } });
        }
        whereClause = { AND: andConditions };
      } else if (studentTier === 'COMPETITIVE') {
        whereClause = { tier: 'COMPETITIVE' };
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
