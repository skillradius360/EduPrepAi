import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: Fetch questions (filterable by status)
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const whereCondition = statusFilter ? { status: statusFilter } : {};

    const questions = await db.question.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        topic: {
          include: {
            chapter: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Admin Questions GET API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// PATCH: Approve or Reject AI-generated question
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { questionId, status } = body;

    if (!questionId || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid question update payload' }, { status: 400 });
    }

    const updated = await db.question.update({
      where: { id: questionId },
      data: { status },
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error) {
    console.error('Admin Questions PATCH API Error:', error);
    return NextResponse.json({ error: 'Failed to update question status' }, { status: 500 });
  }
}

// DELETE: Remove question
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    await db.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('Admin Question DELETE API Error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
