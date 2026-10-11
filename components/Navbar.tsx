'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  BookOpen,
  BarChart3,
  Lightbulb,
  Shield,
  LogOut,
  User,
  ChevronDown,
  Layers,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    class?: string | null;
    institutionType?: string | null;
    degreeMajor?: string | null;
  } | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Navbar({ user, onToggleSidebar, isSidebarOpen = true }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [resolvedUser, setResolvedUser] = useState(user);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResolvedUser(user);
    if (user !== undefined) return;

    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          setResolvedUser(null);
          return;
        }
        const data = await res.json();
        setResolvedUser(data.user || null);
      } catch {
        setResolvedUser(null);
      }
    }
    loadUser();
  }, [user]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setProfileModalOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Only if click wasn't on the hamburger button itself
        const target = event.target as HTMLElement;
        if (!target.closest('[data-mobile-toggle="true"]')) {
          setMobileMenuOpen(false);
        }
      }
    }
    if (profileModalOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileModalOpen, mobileMenuOpen]);

  // Close modals on navigation
  useEffect(() => {
    setProfileModalOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('eduprep_access_token');
      localStorage.removeItem('eduprep_token_expires_at');
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const normalizedRole = resolvedUser?.role?.toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN';
  const isStudent = !!resolvedUser && !isAdmin;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/90 text-white select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Retractable Sidebar Toggle Button + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {resolvedUser && (
            <>
              {/* Desktop Retract Toggle Button */}
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  type="button"
                  className="hidden md:flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                  title={isSidebarOpen ? 'Retract side menu' : 'Expand side menu'}
                  aria-label={isSidebarOpen ? 'Retract side menu' : 'Expand side menu'}
                >
                  {isSidebarOpen ? (
                    <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-sky-400 transition-colors" />
                  ) : (
                    <PanelLeftOpen className="w-4 h-4 text-sky-400" />
                  )}
                </button>
              )}

              {/* Mobile Phone Hamburger Menu Button */}
              <button
                type="button"
                data-mobile-toggle="true"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex md:hidden items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-sky-400" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-300" />
                )}
              </button>
            </>
          )}

          <Link
            href={resolvedUser ? (isAdmin ? '/admin' : '/dashboard') : '/'}
            className="flex items-center gap-2 sm:gap-2.5 group"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-sky-300">
                  EduPrep AI
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden xs:block">Smart Exam Preparation</p>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links (HIDDEN on phone screens as requested; phone options are in side menu) */}
        {resolvedUser && (
          <nav className="hidden md:flex items-center gap-1.5 flex-1 min-w-0 mx-4 py-1 justify-center">
            {isStudent && (
              <>
                <Link
                  href="/dashboard"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                    pathname === '/dashboard'
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/practice"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                    pathname === '/practice'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>AI Practice</span>
                </Link>
                <Link
                  href="/analytics"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                    pathname === '/analytics'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>Analytics</span>
                </Link>
                <Link
                  href="/recommendations"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                    pathname === '/recommendations'
                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 flex-shrink-0 text-purple-400" />
                  <span>Advice</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                prefetch={true}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  pathname === '/admin'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Shield className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        )}

        {/* Right: User Icon & Translucent Profile Modal Menu */}
        <div className="flex items-center gap-2 flex-shrink-0 relative" ref={modalRef}>
          {resolvedUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileModalOpen(!profileModalOpen)}
                className={`flex items-center gap-2 p-1.5 sm:py-1.5 sm:px-2.5 rounded-xl border transition-all duration-150 ${
                  profileModalOpen
                    ? 'bg-slate-800/80 border-sky-500/60 text-white shadow-lg shadow-sky-500/15 ring-2 ring-sky-500/20'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white'
                }`}
                aria-expanded={profileModalOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <User className="w-4 h-4 text-sky-300" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-white max-w-[110px] truncate leading-tight">
                    {resolvedUser.name || 'Account'}
                  </p>
                  <p className="text-[10px] text-sky-400 font-medium">
                    {isAdmin ? 'Administrator' : resolvedUser.class || 'Student'}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    profileModalOpen ? 'rotate-180 text-sky-400' : ''
                  }`}
                />
              </button>

              {/* TRANSLUCENT PROFILE MODAL (backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-2xl) */}
              {profileModalOpen && (
                <div className="absolute right-0 mt-2.5 w-64 sm:w-72 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-2.5 shadow-2xl shadow-black/60 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10">
                  {/* Account Header */}
                  <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 rounded-xl mb-1.5">
                    <p className="text-xs font-bold text-white">{resolvedUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{resolvedUser.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        {isAdmin ? 'Admin' : resolvedUser.institutionType || 'Student'}
                      </span>
                      {resolvedUser.class && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          • {resolvedUser.class}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions list */}
                  <div className="space-y-1 py-1">
                    <Link
                      href="/profile"
                      prefetch={true}
                      onClick={() => setProfileModalOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/70 transition-colors"
                    >
                      <User className="w-4 h-4 text-sky-400" />
                      <span>Open Profile & Settings</span>
                    </Link>

                    <Link
                      href="/profile"
                      prefetch={true}
                      onClick={() => setProfileModalOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/70 transition-colors"
                    >
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>Curriculum & Syllabus Tree</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        prefetch={true}
                        onClick={() => setProfileModalOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white hover:bg-indigo-600/20 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-indigo-400" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                  </div>

                  {/* Divider & Logout Button */}
                  <div className="border-t border-slate-800/80 pt-1.5 mt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                prefetch={true}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                prefetch={true}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md shadow-sky-600/25 transition-all whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE PHONE SIDE HAMBURGER DRAWER (Holds all navigation options when on phone) */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-150"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2 pb-1 border-b border-slate-800/80 flex items-center justify-between">
            <span>Navigation Menu</span>
            <span className="text-[10px] text-sky-400 font-medium">EduPrep Mobile</span>
          </div>

          <nav className="space-y-1">
            {isStudent && (
              <>
                <Link
                  href="/dashboard"
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/dashboard'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/practice"
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/practice'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI Practice Mode</span>
                </Link>
                <Link
                  href="/analytics"
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/analytics'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Performance Analytics</span>
                </Link>
                <Link
                  href="/recommendations"
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/recommendations'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-purple-400" />
                  <span>Personalized Advice</span>
                </Link>
                <Link
                  href="/profile"
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/profile'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4 text-sky-400" />
                  <span>Profile & Syllabus Tree</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  pathname === '/admin'
                    ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Admin Control Center</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
