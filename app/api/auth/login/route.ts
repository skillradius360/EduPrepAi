import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ACCESS_TOKEN_MAX_AGE_SECONDS, ACCESS_TOKEN_NAME, comparePassword, createAccessToken } from '@/lib/auth';
import { LoginSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = LoginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email address or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email address or password.' },
        { status: 401 }
      );
    }

    const accessToken = await createAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS,
      redirectTo: (user.role || '').toUpperCase() === 'ADMIN' ? '/admin' : '/dashboard',
    });

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
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'Login failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}
