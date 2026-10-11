'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { UserPlus, Sparkles, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionType, setInstitutionType] = useState<'SCHOOL' | 'COLLEGE' | 'COMPETITIVE'>('SCHOOL');
  const [userClass, setUserClass] = useState('Class 10');
  const [board, setBoard] = useState('CBSE');
  const [degreeMajor, setDegreeMajor] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [semester, setSemester] = useState<number>(1);
  const [customMajor, setCustomMajor] = useState('');

  // Dynamically populated options
  const [options, setOptions] = useState<{
    schoolClasses: string[];
    schoolBoards: string[];
    collegeMajors: string[];
    universities: string[];
    competitiveExams: string[];
  }>({
    schoolClasses: [],
    schoolBoards: [],
    collegeMajors: [],
    universities: [],
    competitiveExams: [],
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch('/api/curriculum/options');
        const data = await res.json();
        if (data.options) {
          setOptions(data.options);
          // Seed defaults from DB — only real values that admin has configured
          if (data.options.schoolClasses.length > 0) setUserClass(data.options.schoolClasses[0]);
          if (data.options.schoolBoards.length > 0) setBoard(data.options.schoolBoards[0]);
          if (data.options.collegeMajors.length > 0) setDegreeMajor(data.options.collegeMajors[0]);
          if (data.options.universities.length > 0) setUniversityName(data.options.universities[0]);
        }
      } catch (e) {
        console.error('Failed to load dynamic options', e);
      }
    }
    loadOptions();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const finalMajor = degreeMajor === 'OTHER' ? customMajor : degreeMajor;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          institutionType,
          class: institutionType === 'COLLEGE' ? 'UG/PG' : institutionType === 'COMPETITIVE' ? 'Entrance' : userClass,
          board: institutionType === 'COLLEGE' ? (universityName || 'University') : institutionType === 'COMPETITIVE' ? 'National' : board,
          degreeMajor: institutionType === 'COLLEGE' ? finalMajor : undefined,
          universityName: institutionType === 'COLLEGE' ? universityName : undefined,
          semester: institutionType === 'COLLEGE' ? semester : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      if (data.accessToken) {
        localStorage.setItem('eduprep_access_token', data.accessToken);
        localStorage.setItem('eduprep_token_expires_at', String(Date.now() + (data.expiresIn || 864000) * 1000));
      }

      window.location.href = data.redirectTo || '/dashboard';
    } catch (err) {
      setError('An unexpected connection error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Student Account</h1>
            <p className="text-xs text-slate-400">Join EduPrep AI for customized syllabus-focused exam prep</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Institution / Target Exam Tier Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Education Track / Institution Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setInstitutionType('SCHOOL')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    institutionType === 'SCHOOL'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  School (K-12)
                </button>
                <button
                  type="button"
                  onClick={() => setInstitutionType('COLLEGE')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    institutionType === 'COLLEGE'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  College (UG/PG)
                </button>
                <button
                  type="button"
                  onClick={() => setInstitutionType('COMPETITIVE')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    institutionType === 'COMPETITIVE'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Competitive
                </button>
              </div>
            </div>

            {/* School Options */}
            {institutionType === 'SCHOOL' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Class
                  </label>
                  <select
                    value={userClass}
                    onChange={(e) => setUserClass(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {options.schoolClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Board
                  </label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {options.schoolBoards.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* College Options */}
            {institutionType === 'COLLEGE' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Degree / Major
                  </label>
                  <select
                    value={degreeMajor}
                    onChange={(e) => setDegreeMajor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {options.collegeMajors.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="OTHER">Other / Custom Major...</option>
                  </select>
                </div>

                {degreeMajor === 'OTHER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Enter Your Major / Degree
                    </label>
                    <input
                      type="text"
                      required
                      value={customMajor}
                      onChange={(e) => setCustomMajor(e.target.value)}
                      placeholder="e.g. B.Tech Artificial Intelligence, B.Com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      University / College
                    </label>
                    <input
                      type="text"
                      value={universityName}
                      onChange={(e) => setUniversityName(e.target.value)}
                      placeholder="e.g. Delhi University, VTU"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Competitive Exam Track */}
            {institutionType === 'COMPETITIVE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Competitive Exam
                </label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {options.competitiveExams.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link href="/login" className="text-sky-400 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
