'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ProgressCard from '@/components/ProgressCard';
import AdminManualQuestionForm from '@/components/AdminManualQuestionForm';
import AdminCameraExtraction from '@/components/AdminCameraExtraction';
import AdminSyllabusResearch from '@/components/AdminSyllabusResearch';
import {
  Shield,
  Users,
  BookOpen,
  FileText,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  Camera,
  Globe,
  Filter,
  Award,
  Search,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  questionText: string;
  questionType: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer?: number | null;
  expectedAnswer?: string | null;
  markingScheme?: string | null;
  explanation?: string | null;
  difficulty: string;
  marks: number;
  source: string;
  sourceType: string;
  status: string;
  createdAt: string;
  topic: {
    name: string;
    chapter: {
      name: string;
      subject: {
        name: string;
      };
    };
  };
}

interface SubjectItem {
  id: string;
  name: string;
  class: string;
  board: string;
  tier?: string;
  degreeMajor?: string | null;
  syllabusType?: string | null;
  universityName?: string | null;
  chapters: {
    id: string;
    name: string;
    topics: {
      id: string;
      name: string;
    }[];
  }[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'AI_REVIEW' | 'MANUAL_ADD' | 'CAMERA_EXTRACT' | 'SYLLABUS' | 'QUESTION_BANK' | 'CURRICULUM'>('AI_REVIEW');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [questionSearch, setQuestionSearch] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [curriculum, setCurriculum] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string; class?: string | null } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Curriculum form states
  const [newItemType, setNewItemType] = useState<'SUBJECT' | 'CHAPTER' | 'TOPIC'>('SUBJECT');
  const [newItemName, setNewItemName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [subjectTier, setSubjectTier] = useState<'SCHOOL' | 'COLLEGE' | 'COMPETITIVE'>('SCHOOL');
  const [subjectSchoolClass, setSubjectSchoolClass] = useState('Class 10');
  const [subjectDegreeMajor, setSubjectDegreeMajor] = useState('');
  const [subjectSyllabusType, setSubjectSyllabusType] = useState<'STANDARD' | 'UGC_MODEL' | 'CUSTOM_UNIVERSITY' | 'PYQ_OFFICIAL'>('STANDARD');
  const [subjectUniversityName, setSubjectUniversityName] = useState('');
  const [subjectCompetitiveExam, setSubjectCompetitiveExam] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.stats) setStats(statsData.stats);

      const qRes = await fetch(`/api/admin/questions?status=${statusFilter}`);
      const qData = await qRes.json();
      if (qData.questions) setQuestions(qData.questions);

      const cRes = await fetch('/api/curriculum');
      const cData = await cRes.json();
      if (cData.subjects) setCurriculum(cData.subjects);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        const user = data.user;

        if (!res.ok || !user) {
          router.replace('/login');
          return;
        }

        if ((user.role || '').toUpperCase() !== 'ADMIN') {
          router.replace('/dashboard');
          return;
        }

        setAdminUser(user);
        await loadData();
      } catch (err) {
        console.error('Admin auth check failed:', err);
        router.replace('/dashboard');
      } finally {
        setAuthChecking(false);
      }
    }

    verifyAdmin();
  }, [statusFilter]);

  const handleUpdateStatus = async (questionId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, status: newStatus }),
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions?id=${questionId}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCurriculumItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    try {
      const computedClass =
        subjectTier === 'COLLEGE' ? 'UG/PG' : subjectTier === 'COMPETITIVE' ? 'Entrance' : subjectSchoolClass || 'Class 10';
      const computedBoard =
        subjectTier === 'COLLEGE'
          ? (subjectSyllabusType === 'CUSTOM_UNIVERSITY' ? (subjectUniversityName || 'University') : 'UGC')
          : subjectTier === 'COMPETITIVE'
          ? (subjectCompetitiveExam || 'National')
          : 'CBSE';

      const res = await fetch('/api/admin/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newItemType,
          name: newItemName,
          parentId: selectedParentId,
          className: computedClass,
          board: computedBoard,
          tier: newItemType === 'SUBJECT' ? subjectTier : undefined,
          degreeMajor: newItemType === 'SUBJECT' && subjectTier === 'COLLEGE' ? subjectDegreeMajor : undefined,
          syllabusType: newItemType === 'SUBJECT' && subjectTier === 'COLLEGE' ? subjectSyllabusType : newItemType === 'SUBJECT' && subjectTier === 'COMPETITIVE' ? 'PYQ_OFFICIAL' : 'STANDARD',
          universityName: newItemType === 'SUBJECT' && subjectTier === 'COLLEGE' && subjectSyllabusType === 'CUSTOM_UNIVERSITY' ? subjectUniversityName : undefined,
        }),
      });

      if (res.ok) {
        setNewItemName('');
        setSubjectDegreeMajor('');
        setSubjectUniversityName('');
        setSubjectCompetitiveExam('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCurriculumItem = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const res = await fetch(`/api/admin/curriculum?type=${type}&id=${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (typeFilter !== 'ALL' && q.questionType !== typeFilter) return false;
    if (questionSearch.trim()) {
      const qLower = questionSearch.toLowerCase();
      const matchText = (q.questionText || '').toLowerCase().includes(qLower);
      const matchSub = (q.topic?.chapter?.subject?.name || '').toLowerCase().includes(qLower);
      const matchChap = (q.topic?.chapter?.name || '').toLowerCase().includes(qLower);
      const matchTopic = (q.topic?.name || '').toLowerCase().includes(qLower);
      return matchText || matchSub || matchChap || matchTopic;
    }
    return true;
  });

  if (authChecking || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        Verifying admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar
        user={adminUser}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar role="ADMIN" isOpen={isSidebarOpen} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 min-w-0 overflow-y-auto">
          {/* Admin Header */}
          <div className="border-b border-slate-800 pb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                  <Shield className="w-6 h-6 text-indigo-400" />
                  EduPrep AI Admin Control Center
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Human-in-the-Loop Quality Control, Manual Question Builder, Camera Extraction, and Syllabus Sources.
                </p>
              </div>
            </div>

            {/* Navigation Bar Tabs (Scrollable on small mobile screens) */}
            <div className="flex overflow-x-auto gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl scrollbar-none max-w-full">
              <button
                onClick={() => setActiveTab('AI_REVIEW')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'AI_REVIEW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Question Queue
              </button>

              <button
                onClick={() => setActiveTab('MANUAL_ADD')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'MANUAL_ADD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Question (MCQ / 2M / 5M / NAT)
              </button>

              <button
                onClick={() => setActiveTab('CAMERA_EXTRACT')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'CAMERA_EXTRACT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4 text-amber-400" />
                Camera Extraction
              </button>

              <button
                onClick={() => setActiveTab('SYLLABUS')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'SYLLABUS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4 text-sky-400" />
                Syllabus Sources
              </button>

              <button
                onClick={() => setActiveTab('QUESTION_BANK')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'QUESTION_BANK' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Question Bank
              </button>

              <button
                onClick={() => setActiveTab('CURRICULUM')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'CURRICULUM' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Curriculum Tree
              </button>
            </div>
          </div>

          {/* Admin Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <ProgressCard title="Students" value={stats.totalStudents} subtitle="Registered" iconName="users" color="sky" />
              <ProgressCard title="Subjects" value={stats.totalSubjects} subtitle="Active" iconName="book" color="indigo" />
              <ProgressCard title="Topics" value={stats.totalTopics} subtitle="Curriculum" iconName="layers" color="emerald" />
              <ProgressCard title="Question Bank" value={stats.totalQuestions} subtitle="Total Stored" iconName="help" color="purple" />
              <ProgressCard title="Pending AI" value={stats.pendingQuestionsCount} subtitle="Needs Review" iconName="sparkles" color="amber" />
              <ProgressCard title="Tests Taken" value={stats.totalAttempts} subtitle="Student Runs" iconName="file" color="sky" />
            </div>
          )}

          {/* TAB 1: AI QUESTION QUALITY CONTROL QUEUE */}
          {activeTab === 'AI_REVIEW' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    AI-Generated Question Review Queue
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Human-in-the-Loop Quality Control: Review pending AI & extracted questions before publication.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
                  {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        statusFilter === st
                          ? st === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : st === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading AI questions queue...</div>
              ) : questions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm space-y-2">
                  <p>No questions found under status &quot;{statusFilter}&quot;.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <span className="text-xs font-bold text-sky-400">
                            {q.topic.chapter.subject.name} → {q.topic.chapter.name} → {q.topic.name}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Type: <strong className="text-indigo-400">{q.questionType} ({q.marks} Marks)</strong> • Source: {q.source}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {q.status}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                            {q.difficulty}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-white text-base leading-relaxed">{q.questionText}</h3>

                      {q.questionType === 'MCQ' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className={`p-2.5 rounded-xl border ${q.correctAnswer === 0 ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                            <strong className="text-sky-400">A:</strong> {q.optionA}
                          </div>
                          <div className={`p-2.5 rounded-xl border ${q.correctAnswer === 1 ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                            <strong className="text-sky-400">B:</strong> {q.optionB}
                          </div>
                          <div className={`p-2.5 rounded-xl border ${q.correctAnswer === 2 ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                            <strong className="text-sky-400">C:</strong> {q.optionC}
                          </div>
                          <div className={`p-2.5 rounded-xl border ${q.correctAnswer === 3 ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                            <strong className="text-sky-400">D:</strong> {q.optionD}
                          </div>
                        </div>
                      )}

                      {q.questionType !== 'MCQ' && q.expectedAnswer && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                          <strong className="text-emerald-400 block">Expected Model Answer:</strong>
                          <p>{q.expectedAnswer}</p>
                          {q.markingScheme && <p className="text-[11px] text-slate-500 mt-1">Marking Scheme: {q.markingScheme}</p>}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2">
                        {q.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(q.id, 'APPROVED')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve Question
                          </button>
                        )}
                        {q.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(q.id, 'REJECTED')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL QUESTION CREATION */}
          {activeTab === 'MANUAL_ADD' && (
            <AdminManualQuestionForm onCreated={loadData} />
          )}

          {/* TAB 3: CAMERA EXTRACTION */}
          {activeTab === 'CAMERA_EXTRACT' && (
            <AdminCameraExtraction onApproved={loadData} />
          )}

          {/* TAB 4: SYLLABUS RESEARCH */}
          {activeTab === 'SYLLABUS' && (
            <AdminSyllabusResearch />
          )}

          {/* TAB 5: CENTRALIZED QUESTION BANK */}
          {activeTab === 'QUESTION_BANK' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-400" />
                    Centralized Question Bank
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Filter and manage stored questions across MCQs, 2-mark short questions, and 5-mark long descriptive questions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      placeholder="Search questions, topics, subjects..."
                      className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-48 sm:w-64 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-semibold">Type:</span>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs font-bold text-white rounded-xl p-2"
                    >
                      <option value="ALL">All Types</option>
                      <option value="MCQ">MCQ (1 Mark)</option>
                      <option value="SHORT_2_MARK">Short (2 Marks)</option>
                      <option value="LONG_5_MARK">Long (5 Marks)</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl bg-slate-950 border border-slate-800/80">
                  No questions found matching your filter criteria.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuestions.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-sky-400">{q.topic.chapter.subject.name} → {q.topic.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                          {q.questionType} ({q.marks}M)
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${q.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {q.status}
                        </span>
                      </div>
                      <p className="text-xs text-white font-medium">{q.questionText}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

          {/* TAB 6: CURRICULUM MANAGEMENT */}
          {activeTab === 'CURRICULUM' && (
            <div className="space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-400" />
                    Add Curriculum Entity
                  </h2>
                </div>

                <form onSubmit={handleAddCurriculumItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Entity Type
                    </label>
                    <select
                      value={newItemType}
                      onChange={(e: any) => setNewItemType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                    >
                      <option value="SUBJECT">New Subject</option>
                      <option value="CHAPTER">New Chapter</option>
                      <option value="TOPIC">New Topic</option>
                    </select>
                  </div>

                  {newItemType !== 'SUBJECT' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        {newItemType === 'CHAPTER' ? 'Parent Subject' : 'Parent Chapter'}
                      </label>
                      <select
                        value={selectedParentId}
                        onChange={(e) => setSelectedParentId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                      >
                        <option value="">Select Parent...</option>
                        {newItemType === 'CHAPTER'
                          ? curriculum.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))
                          : curriculum.flatMap((s) =>
                              s.chapters.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {s.name} → {c.name}
                                </option>
                              ))
                            )}
                      </select>
                    </div>
                  )}

                  {newItemType === 'SUBJECT' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Tier
                        </label>
                        <select
                          value={subjectTier}
                          onChange={(e: any) => setSubjectTier(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                        >
                          <option value="SCHOOL">School (K-12)</option>
                          <option value="COLLEGE">College (UG/PG)</option>
                          <option value="COMPETITIVE">Competitive Entrance</option>
                        </select>
                      </div>

                      {subjectTier === 'SCHOOL' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Class (e.g. Class 10, Class 11, Class 12)
                          </label>
                          <input
                            type="text"
                            value={subjectSchoolClass}
                            onChange={(e) => setSubjectSchoolClass(e.target.value)}
                            placeholder="e.g. Class 11, Class 12"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                          />
                        </div>
                      )}

                      {subjectTier === 'COMPETITIVE' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Competitive Exam Name
                          </label>
                          <input
                            type="text"
                            value={subjectCompetitiveExam}
                            onChange={(e) => setSubjectCompetitiveExam(e.target.value)}
                            placeholder="e.g. GATE CS, NExT, CAT, CET, UPSC"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                          />
                        </div>
                      )}

                      {subjectTier === 'COLLEGE' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                              Degree / Major
                            </label>
                            <input
                              type="text"
                              value={subjectDegreeMajor}
                              onChange={(e) => setSubjectDegreeMajor(e.target.value)}
                              placeholder="e.g. B.Tech CSE, B.Sc Physics"
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                              Syllabus Model
                            </label>
                            <select
                              value={subjectSyllabusType}
                              onChange={(e: any) => setSubjectSyllabusType(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                            >
                              <option value="UGC_MODEL">UGC Model Syllabus</option>
                              <option value="CUSTOM_UNIVERSITY">Custom University</option>
                            </select>
                          </div>
                          {subjectSyllabusType === 'CUSTOM_UNIVERSITY' && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                University Name
                              </label>
                              <input
                                type="text"
                                value={subjectUniversityName}
                                onChange={(e) => setSubjectUniversityName(e.target.value)}
                                placeholder="e.g. Mumbai University"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  <div className={newItemType !== 'SUBJECT' || subjectTier !== 'COLLEGE' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder={
                        newItemType === 'SUBJECT'
                          ? subjectTier === 'COLLEGE'
                            ? 'e.g. Operating Systems'
                            : subjectTier === 'COMPETITIVE'
                            ? 'e.g. GATE CS / CAT Quant'
                            : 'e.g. Mathematics'
                          : 'e.g. Process Scheduling or Triangles'
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Entity
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-sky-400" />
                    Existing Curriculum Tree
                  </h2>
                </div>

                <div className="space-y-6">
                  {curriculum.map((sub) => (
                    <div key={sub.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h3 className="font-bold text-sky-400 text-base flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          {sub.name}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                            {sub.tier === 'COLLEGE'
                              ? `College: ${sub.degreeMajor || 'UG'} (${sub.syllabusType === 'UGC_MODEL' ? 'UGC Model' : sub.universityName || 'Custom'})`
                              : sub.tier === 'COMPETITIVE'
                              ? 'Competitive'
                              : `${sub.class} - ${sub.board}`}
                          </span>
                        </h3>
                        <button
                          onClick={() => handleDeleteCurriculumItem('SUBJECT', sub.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="pl-4 space-y-3">
                        {sub.chapters.map((ch) => (
                          <div key={ch.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-indigo-300 text-sm flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5" />
                                {ch.name}
                              </h4>
                              <button
                                onClick={() => handleDeleteCurriculumItem('CHAPTER', ch.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2 pl-4 pt-1">
                              {ch.topics.map((top) => (
                                <div
                                  key={top.id}
                                  className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-2"
                                >
                                  <span>{top.name}</span>
                                  <button
                                    onClick={() => handleDeleteCurriculumItem('TOPIC', top.id)}
                                    className="text-slate-400 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
