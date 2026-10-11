import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { type, name, parentId, className, board, tier, degreeMajor, syllabusType, universityName, semester } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    if (type === 'SUBJECT') {
      const subject = await (db.subject as any).create({
        data: {
          name,
          class: className || 'Class 10',
          board: board || 'CBSE',
          tier: tier || 'SCHOOL',
          degreeMajor: degreeMajor || null,
          syllabusType: syllabusType || 'STANDARD',
          universityName: universityName || null,
          semester: semester ? Number(semester) : null,
        },
      });
      return NextResponse.json({ success: true, item: subject });
    }

    if (type === 'CHAPTER') {
      if (!parentId) return NextResponse.json({ error: 'Subject ID required for Chapter' }, { status: 400 });
      const chapter = await db.chapter.create({
        data: {
          name,
          subjectId: parentId,
        },
      });
      return NextResponse.json({ success: true, item: chapter });
    }

    if (type === 'TOPIC') {
      if (!parentId) return NextResponse.json({ error: 'Chapter ID required for Topic' }, { status: 400 });
      const topic = await db.topic.create({
        data: {
          name,
          chapterId: parentId,
        },
      });
      return NextResponse.json({ success: true, item: topic });
    }

    return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
  } catch (error) {
    console.error('Admin Curriculum POST API Error:', error);
    return NextResponse.json({ error: 'Failed to create curriculum item' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type parameters required' }, { status: 400 });
    }

    if (type === 'SUBJECT') {
      await db.subject.delete({ where: { id } });
    } else if (type === 'CHAPTER') {
      await db.chapter.delete({ where: { id } });
    } else if (type === 'TOPIC') {
      await db.topic.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('Admin Curriculum DELETE API Error:', error);
    return NextResponse.json({ error: 'Failed to delete curriculum item' }, { status: 500 });
  }
}
