import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, institutionType, userClass, board, degreeMajor, universityName, semester } = body;

    const finalInst = institutionType !== undefined ? institutionType : user.institutionType;
    let finalBoard = board !== undefined ? board : user.board;
    if (finalInst === 'SCHOOL') {
      if (!finalBoard || finalBoard === 'GATE CS' || finalBoard === 'National' || finalBoard === 'UGC' || finalBoard.includes('GATE') || finalBoard.includes('CAT')) {
        finalBoard = 'CBSE';
      }
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? name : user.name,
        institutionType: finalInst,
        class: userClass !== undefined ? userClass : user.class,
        board: finalBoard,
        degreeMajor: degreeMajor !== undefined ? degreeMajor : user.degreeMajor,
        universityName: universityName !== undefined ? universityName : user.universityName,
        semester: semester !== undefined ? (semester ? Number(semester) : null) : user.semester,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        institutionType: updated.institutionType,
        class: updated.class,
        board: updated.board,
        degreeMajor: updated.degreeMajor,
        universityName: updated.universityName,
        semester: updated.semester,
      },
    });
  } catch (error) {
    console.error('Update Profile API Error:', error);
    return NextResponse.json({ error: 'Failed to update profile settings' }, { status: 500 });
  }
}
