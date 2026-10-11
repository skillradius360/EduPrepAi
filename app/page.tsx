import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/auth';
import { Sparkles, BarChart3, Lightbulb, ArrowRight, ShieldCheck, CheckCircle2, GraduationCap } from 'lucide-react';

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar user={user} />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-sky-400 mb-8 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI-Driven CBSE Class 10 Exam Preparation Platform</span>
          </div>

          {/* Main Title & Subtitle */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            EduPrep <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">AI</span>
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-slate-300 mb-4 max-w-3xl mx-auto">
            AI-Powered Personalized Student Preparation
          </p>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice smarter with AI-generated questions, personalized tests and performance-based recommendations tailored for Indian school students.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            {user ? (
              <Link
                href={(user.role || '').toUpperCase() === 'ADMIN' ? '/admin' : '/dashboard'}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-bold text-base border border-slate-800 flex items-center justify-center transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How EduPrep AI Transforms Exam Preparation</h2>
            <p className="text-slate-400 text-sm mt-2">A comprehensive, syllabus-aligned learning and assessment ecosystem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl hover:border-sky-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Practice</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Generate instant practice questions based on your specific subject, chapter, topic, and preferred difficulty level.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Analytics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Track your score trends over time and view interactive topic performance charts to clearly identify your strengths and weaknesses.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl hover:border-purple-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Personalized Guidance</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Receive targeted guidance highlighting areas that require revision based on your real assessment accuracy thresholds.
              </p>
            </div>
          </div>
        </section>

        {/* Study Flow Workflow Banner */}
        <section className="py-12 bg-slate-900/50 border-y border-slate-900 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-3">Assessment & Mastery Workflow</p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-slate-300">
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">1. Select Topic</span>
              <span>→</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">2. Generate AI Questions</span>
              <span>→</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">3. Take Test</span>
              <span>→</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">4. Auto Scoring</span>
              <span>→</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">5. Analytics & Advice</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 EduPrep AI. Intelligent Exam Preparation Platform.</p>
        </div>
      </footer>
    </div>
  );
}
