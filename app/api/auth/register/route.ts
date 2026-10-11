import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ACCESS_TOKEN_MAX_AGE_SECONDS, ACCESS_TOKEN_NAME, createAccessToken, hashPassword } from '@/lib/auth';
import { RegisterSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = RegisterSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      institutionType,
      class: userClass,
      board,
      degreeMajor,
      universityName,
      semester,
    } = validated.data;

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'STUDENT',
        institutionType: institutionType || 'SCHOOL',
        class: userClass || (institutionType === 'COLLEGE' ? 'UG/PG' : institutionType === 'COMPETITIVE' ? 'Entrance' : 'Class 10'),
        board: board || (institutionType === 'COLLEGE' ? (universityName || 'University') : institutionType === 'COMPETITIVE' ? 'National' : 'CBSE'),
        degreeMajor: degreeMajor || null,
        universityName: universityName || null,
        semester: semester ? Number(semester) : null,
      },
    });

    const accessToken = await createAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS,
        redirectTo: '/dashboard',
      },
      { status: 201 }
    );

    response.cookies.set({
      name: ACCESS_TOKEN_NAME,
      value: accessToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json(
      { error: 'Registration failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}
