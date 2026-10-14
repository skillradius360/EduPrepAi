'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import {
  User,
  BookOpen,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building,
  Layers,
  School,
  GraduationCap,
  Trophy,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowRight,
  Edit3,
  Calendar,
  FileText,
  BadgeCheck,
  Compass
} from 'lucide-react';

interface Topic {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

interface Subject {
  id: string;
  name: string;
  class?: string | null;
  board?: string | null;
  tier?: string | null;
  degreeMajor?: string | null;
  semester?: number | null;
  chapters: Chapter[];
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    institutionType: string;
    class: string;
    board: string;
    degreeMajor: string;
    universityName: string;
    semester: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Retractable sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Curriculum subjects for this user
  const [curriculumSubjects, setCurriculumSubjects] = useState<Subject[]>([]);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditTrack, setShowEditTrack] = useState(false);
  const [activeTab, setActiveTab] = useState<'CURRICULUM' | 'UPLOAD'>('CURRICULUM');

  // Editable Profile fields
  const [name, setName] = useState('');
  const [institutionType, setInstitutionType] = useState('COLLEGE');
  const [userClass, setUserClass] = useState('');
  const [board, setBoard] = useState('');
  const [degreeMajor, setDegreeMajor] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [semester, setSemester] = useState<number>(1);

  // Dynamic Options (DB-driven)
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

  // Syllabus Upload State
  const [scopeType, setScopeType] = useState<'WHOLE_YEAR' | 'SEMESTER'>('SEMESTER');
  const [uploadSemester, setUploadSemester] = useState<number>(1);
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [subjectName, setSubjectName] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');
  const [uploadErrorMessage, setUploadErrorMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, optRes, currRes] = await Promise.all([
          fetch('/api/auth/profile'),
          fetch('/api/curriculum/options'),
          fetch('/api/curriculum?enforceUser=true'),
        ]);

        const profData = await profRes.json();
        const optData = await optRes.json();
        const currData = await currRes.json();

        if (profData.user) {
          const user = profData.user;
          const inst = user.institutionType || 'COLLEGE';
          let safeBoard = user.board || '';
          if (inst === 'SCHOOL' && (!safeBoard || safeBoard === 'GATE CS' || safeBoard === 'National' || safeBoard === 'UGC')) {
            safeBoard = 'CBSE';
          }
          user.board = safeBoard;
          setProfile(user);
          setName(user.name || '');
          setInstitutionType(inst);
          setUserClass(user.class || '');
          setBoard(safeBoard);
          setDegreeMajor(user.degreeMajor || '');
          setUniversityName(user.universityName || '');
          setSemester(user.semester || 1);
          setUploadSemester(user.semester || 1);
        }

        if (optData.options) {
          setOptions(optData.options);
        }

        if (currData.subjects) {
          setCurriculumSubjects(currData.subjects);
          if (currData.subjects.length > 0) {
            setExpandedSubjectId(currData.subjects[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          institutionType,
          userClass,
          board,
          degreeMajor,
          universityName,
          semester,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile settings.');
        setSaving(false);
        return;
      }

      setProfile(data.user);
      setMessage('Academic profile updated successfully! Your curriculum is synchronized.');
      setShowEditTrack(false);

      // Refresh curriculum for the updated profile
      const currRes = await fetch('/api/curriculum?enforceUser=true');
      const currData = await currRes.json();
      if (currData.subjects) {
        setCurriculumSubjects(currData.subjects);
        if (currData.subjects.length > 0) {
          setExpandedSubjectId(currData.subjects[0].id);
        }
      }
    } catch (err) {
      setError('Connection error while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingSyllabus(true);
    setUploadSuccessMessage('');
    setUploadErrorMessage('');

    try {
      const res = await fetch('/api/syllabus/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusText,
          scopeType,
          semester: scopeType === 'SEMESTER' ? uploadSemester : undefined,
          academicYear: scopeType === 'WHOLE_YEAR' ? academicYear : undefined,
          subjectName: subjectName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadErrorMessage(data.error || 'Failed to upload syllabus.');
        setUploadingSyllabus(false);
        return;
      }

      setUploadSuccessMessage(data.message || 'Syllabus successfully ingested into your learning plan!');
      setSyllabusText('');
      setSubjectName('');

      // Refresh curriculum
      const currRes = await fetch('/api/curriculum?enforceUser=true');
      const currData = await currRes.json();
      if (currData.subjects) {
        setCurriculumSubjects(currData.subjects);
      }
    } catch (err) {
      setUploadErrorMessage('Network error while uploading syllabus.');
    } finally {
      setUploadingSyllabus(false);
    }
  };

  const filteredCurriculum = curriculumSubjects.filter((sub) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchSub = sub.name.toLowerCase().includes(term);
    const matchChapter = sub.chapters?.some((c) =>
      c.name.toLowerCase().includes(term) || c.topics?.some((t) => t.name.toLowerCase().includes(term))
    );
    return matchSub || matchChapter;
  });

  const totalChapters = curriculumSubjects.reduce((acc, s) => acc + (s.chapters?.length || 0), 0);
  const totalTopics = curriculumSubjects.reduce(
    (acc, s) => acc + (s.chapters?.reduce((cAcc, c) => cAcc + (c.topics?.length || 0), 0) || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <Sparkles className="w-5 h-5 animate-spin text-sky-400 mr-2" />
        <span>Loading academic profile & curriculum tree...</span>
      </div>
    );
  }

  const track = profile?.institutionType || 'SCHOOL';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar
        user={profile}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex">
        <Sidebar role={profile?.role || 'STUDENT'} isOpen={isSidebarOpen} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">
          {/* Top Banner & Profile Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                <User className="w-6 h-6 text-sky-400" />
                Student Academic Profile
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Your enrolled educational track, verified curriculum tree, and custom syllabus ingestion workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditTrack(!showEditTrack)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  showEditTrack
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                <span>{showEditTrack ? 'Close Editor' : 'Edit Academic Track'}</span>
              </button>
            </div>
          </div>

          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ACTIVE ACADEMIC ENROLLMENT CARD (Selected during signup) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                    {track === 'SCHOOL' && <School className="w-3.5 h-3.5 text-sky-400" />}
                    {track === 'COLLEGE' && <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />}
                    {track === 'COMPETITIVE' && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                    <span>
                      {track === 'SCHOOL'
                        ? 'School Track (K-12)'
                        : track === 'COLLEGE'
                        ? 'College / University Track (UG/PG)'
                        : 'Competitive Exam Track'}
                    </span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enrolled as</span>
                    <strong className="text-white">{profile?.name}</strong>
                    <span className="text-slate-500">({profile?.email})</span>
                  </span>
                </div>

                {/* Selected Details from Signup */}
                {track === 'SCHOOL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Target Examination</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {(() => {
                          const cls = profile?.class || '';
                          const num = parseInt(cls.replace(/\D/g, ''), 10);
                          if (num <= 8) return 'Primary / Elementary Examination';
                          if (num === 9 || num === 10) return 'Secondary Board Examination (Class 10)';
                          if (num === 11 || num === 12) return 'Higher Secondary Examination (Class 12)';
                          return profile?.board ? `${profile.board} Board Exam` : 'School Board Examination';
                        })()}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Enrolled Class / Grade</span>
                      <span className="text-sm font-bold text-sky-400 mt-1 block">{profile?.class || 'Not specified'}</span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Education Board</span>
                      <span className="text-sm font-bold text-emerald-400 mt-1 block">
                        {(() => {
                          const b = profile?.board || 'CBSE';
                          if (b === 'GATE CS' || b === 'National' || b === 'UGC') return 'Central Board of Secondary Education (CBSE)';
                          if (b.toUpperCase() === 'CBSE') return 'Central Board of Secondary Education (CBSE)';
                          if (b.toUpperCase() === 'ICSE') return 'ICSE (CISCE Board)';
                          return b;
                        })()}
                      </span>
                    </div>
                  </div>
                )}

                {track === 'COLLEGE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Degree / Major</span>
                      <span className="text-sm font-bold text-white mt-1 block truncate">
                        {profile?.degreeMajor || 'Undergraduate'}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">University / College</span>
                      <span className="text-sm font-bold text-indigo-400 mt-1 block truncate">
                        {profile?.universityName || 'Affiliated University'}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Semester</span>
                      <span className="text-sm font-bold text-amber-400 mt-1 block">
                        Semester {profile?.semester || 1}
                      </span>
                    </div>
                  </div>
                )}

                {track === 'COMPETITIVE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Target Entrance Exam</span>
                      <span className="text-sm font-bold text-purple-400 mt-1 block">
                        {profile?.board || 'Competitive Exam'}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Standard</span>
                      <span className="text-sm font-bold text-white mt-1 block">National Ranking & Assessment</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick curriculum metrics */}
              <div className="grid grid-cols-3 lg:flex lg:flex-col gap-3 justify-between border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6 lg:min-w-[190px]">
                <div className="bg-slate-950/50 lg:bg-transparent p-2.5 lg:p-0 rounded-xl text-center lg:text-left border border-slate-800/50 lg:border-0">
                  <span className="text-[11px] text-slate-400 block">Enrolled Subjects</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 block">{curriculumSubjects.length}</span>
                </div>
                <div className="bg-slate-950/50 lg:bg-transparent p-2.5 lg:p-0 rounded-xl text-center lg:text-left border border-slate-800/50 lg:border-0">
                  <span className="text-[11px] text-slate-400 block">Total Chapters</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-sky-400 mt-0.5 block">{totalChapters}</span>
                </div>
                <div className="bg-slate-950/50 lg:bg-transparent p-2.5 lg:p-0 rounded-xl text-center lg:text-left border border-slate-800/50 lg:border-0">
                  <span className="text-[11px] text-slate-400 block">Total Topics</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-0.5 block">{totalTopics}</span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT TRACK COLLAPSIBLE FORM */}
          {showEditTrack && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">Update Academic Track & Settings</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditTrack(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Institution / Education Track
                    </label>
                    <select
                      value={institutionType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setInstitutionType(newType);
                        if (newType === 'SCHOOL') {
                          if (!board || board === 'GATE CS' || board === 'National' || board === 'UGC') {
                            setBoard(options.schoolBoards[0] || 'CBSE');
                          }
                          if (!userClass) {
                            setUserClass(options.schoolClasses[0] || 'Class 10');
                          }
                        } else if (newType === 'COLLEGE') {
                          if (!degreeMajor) {
                            setDegreeMajor(options.collegeMajors[0] || 'B.Tech Computer Science & Engineering');
                          }
                        } else if (newType === 'COMPETITIVE') {
                          if (!board || board === 'CBSE' || board === 'ICSE') {
                            setBoard(options.competitiveExams[0] || 'GATE CS');
                          }
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="SCHOOL">School (K-12)</option>
                      <option value="COLLEGE">College (UG / PG)</option>
                      <option value="COMPETITIVE">Competitive Entrance</option>
                    </select>
                  </div>
                </div>

                {institutionType === 'SCHOOL' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Class / Grade
                      </label>
                      <select
                        value={userClass}
                        onChange={(e) => setUserClass(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                      >
                        {options.schoolClasses.length === 0 ? (
                          <option value="">No classes configured in database</option>
                        ) : (
                          options.schoolClasses.map((cls) => (
                            <option key={cls} value={cls}>
                              {cls}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Board
                      </label>
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                      >
                        {options.schoolBoards.length === 0 ? (
                          <option value="">No boards configured in database</option>
                        ) : (
                          options.schoolBoards.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                )}

                {institutionType === 'COLLEGE' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Degree / Major
                      </label>
                      <select
                        value={degreeMajor}
                        onChange={(e) => setDegreeMajor(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {options.collegeMajors.length === 0 ? (
                          <option value="">No college majors configured in database</option>
                        ) : (
                          options.collegeMajors.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          University / College Name
                        </label>
                        <input
                          type="text"
                          value={universityName}
                          onChange={(e) => setUniversityName(e.target.value)}
                          placeholder="e.g. Affiliated University Name"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Semester
                        </label>
                        <select
                          value={semester}
                          onChange={(e) => setSemester(Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
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

                {institutionType === 'COMPETITIVE' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Target Entrance Exam
                    </label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {options.competitiveExams.length === 0 ? (
                        <option value="">No competitive exams configured in database</option>
                      ) : (
                        options.competitiveExams.map((ex) => (
                          <option key={ex} value={ex}>
                            {ex}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditTrack(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save & Sync Curriculum'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* WORKSPACE TABS: 1. Live Curriculum Tree | 2. Upload Custom Syllabus */}
          <div className="flex items-center gap-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('CURRICULUM')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                activeTab === 'CURRICULUM'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Enrolled Curriculum Tree</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                {curriculumSubjects.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('UPLOAD')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                activeTab === 'UPLOAD'
                  ? 'border-amber-500 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>Upload Syllabus (Year / Semester)</span>
            </button>
          </div>

          {/* TAB 1: CURRICULUM TREE */}
          {activeTab === 'CURRICULUM' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>Your Enrolled Subjects & Modules</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any topic or chapter below to jump directly into AI Practice Mode.
                  </p>
                </div>

                {/* Search filter */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search subjects, chapters, topics..."
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {filteredCurriculum.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-950/40">
                  <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No curriculum subjects registered yet for this exact track.</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Switch to the &quot;Upload Syllabus&quot; tab above to ingest your course outline, or ask an administrator to add subjects for your class.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCurriculum.map((sub) => {
                    const isExpanded = expandedSubjectId === sub.id;
                    const totalSubTopics = sub.chapters?.reduce((acc, c) => acc + (c.topics?.length || 0), 0) || 0;

                    return (
                      <div
                        key={sub.id}
                        className="border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden transition-all hover:border-slate-700"
                      >
                        {/* Subject Header */}
                        <div
                          onClick={() => setExpandedSubjectId(isExpanded ? null : sub.id)}
                          className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-sky-400" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-sm text-white">{sub.name}</h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/25">
                                  {sub.class || sub.degreeMajor || 'General'}
                                </span>
                                {sub.board && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                    {sub.board}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {sub.chapters?.length || 0} Chapters • {totalSubTopics} Practice Topics
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/practice?subjectId=${sub.id}`}
                              prefetch={true}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
                            >
                              <span>Practice</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>

                        {/* Chapters & Topics Expandable */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/60 space-y-4">
                            {sub.chapters && sub.chapters.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {sub.chapters.map((chapter, idx) => (
                                  <div
                                    key={chapter.id}
                                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2.5 hover:border-slate-700 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] flex items-center justify-center font-mono font-bold">
                                          {idx + 1}
                                        </span>
                                        <span>{chapter.name}</span>
                                      </h4>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {chapter.topics?.length || 0} topics
                                      </span>
                                    </div>

                                    {chapter.topics && chapter.topics.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {chapter.topics.map((t) => (
                                          <Link
                                            key={t.id}
                                            href={`/practice?subjectId=${sub.id}&chapterId=${chapter.id}&topicId=${t.id}`}
                                            prefetch={true}
                                            className="text-[11px] bg-slate-800/90 hover:bg-sky-600/20 hover:text-sky-300 text-slate-300 border border-slate-700/60 hover:border-sky-500/40 rounded-lg px-2.5 py-1 transition-all"
                                          >
                                            {t.name}
                                          </Link>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-500 italic">No topics listed for this chapter</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic">No chapters configured yet for this subject.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SYLLABUS UPLOAD */}
          {activeTab === 'UPLOAD' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <UploadCloud className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-bold text-white">Upload Syllabus (Whole Year or Each Semester)</h2>
                  <p className="text-xs text-slate-400">
                    Upload your official syllabus text to automatically parse chapters and modules into your learning plan.
                  </p>
                </div>
              </div>

              {uploadSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}

              {uploadErrorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadErrorMessage}</span>
                </div>
              )}

              <form onSubmit={handleUploadSyllabus} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Syllabus Scope
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setScopeType('SEMESTER')}
                        className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                          scopeType === 'SEMESTER'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        Each Semester
                      </button>
                      <button
                        type="button"
                        onClick={() => setScopeType('WHOLE_YEAR')}
                        className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                          scopeType === 'WHOLE_YEAR'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        Whole Year
                      </button>
                    </div>
                  </div>

                  <div>
                    {scopeType === 'SEMESTER' ? (
                      <>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Target Semester
                        </label>
                        <select
                          value={uploadSemester}
                          onChange={(e) => setUploadSemester(Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Academic Year
                        </label>
                        <input
                          type="text"
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          placeholder="e.g. 1st Year, 2026-2027"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject Name (Optional Override)
                  </label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Database Management Systems, Data Structures"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Paste Syllabus Content or Course Outline
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    placeholder="Example:&#10;Subject: Object Oriented Programming&#10;Unit 1: Classes & Inheritance&#10;- Polymorphism&#10;- Encapsulation&#10;Unit 2: File Handling and Streams"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingSyllabus}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {uploadingSyllabus ? 'Ingesting and Parsing Syllabus...' : 'Upload & Process Syllabus'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
