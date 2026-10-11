import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'EduPrep AI — AI-Powered Personalized Student Preparation',
  description: 'Practice smarter with AI-generated questions, personalized tests and performance-based recommendations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
