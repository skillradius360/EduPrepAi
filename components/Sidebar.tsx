'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Sparkles, LineChart, Target, Shield, BookCheck } from 'lucide-react';

interface SidebarProps {
  role?: string;
  isOpen?: boolean;
}

export default function Sidebar({ role = 'STUDENT', isOpen = true }: SidebarProps) {
  const pathname = usePathname();

  if (!isOpen) {
    return null;
  }

  if ((role || '').toUpperCase() === 'ADMIN') {
    return (
      <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 p-4 min-h-[calc(100vh-4rem)] flex-col justify-between hidden lg:flex flex-shrink-0 animate-in fade-in duration-200">
        <div className="space-y-6">
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Admin Controls
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin"
                prefetch={true}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === '/admin'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                Admin Dashboard
              </Link>
            </nav>
          </div>
        </div>

        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">Human-in-the-loop AI</p>
          <p>Review and approve AI-generated practice questions before publication.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between hidden md:flex flex-shrink-0 animate-in fade-in duration-200">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Student Portal
          </p>
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              prefetch={true}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              Dashboard
            </Link>
            <Link
              href="/practice"
              prefetch={true}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/practice'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              AI Practice Mode
            </Link>
            <Link
              href="/analytics"
              prefetch={true}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/analytics'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LineChart className="w-4 h-4 text-emerald-400" />
              Performance Analytics
            </Link>
            <Link
              href="/recommendations"
              prefetch={true}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/recommendations'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 text-purple-400" />
              Weak Topic Advice
            </Link>
            <Link
              href="/profile"
              prefetch={true}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/profile'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookCheck className="w-4 h-4 text-sky-400" />
              Profile & Syllabus
            </Link>
          </nav>
        </div>

        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Academic Status
          </p>
          <div className="px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Track</span>
              <span className="font-semibold text-sky-400">Personalized</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Syllabus</span>
              <span className="font-semibold text-slate-200">Live Curriculum</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
