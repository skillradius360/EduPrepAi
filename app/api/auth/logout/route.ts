import { NextResponse } from 'next/server';
import { ACCESS_TOKEN_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set({
    name: ACCESS_TOKEN_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  response.cookies.set({
    name: 'eduprep_session',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
