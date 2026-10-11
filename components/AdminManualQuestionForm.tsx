'use client';

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Sparkles, FileText, BookOpen, Layers } from 'lucide-react';
import { SubjectItem } from '@/components/TopicSelector';

export default function AdminManualQuestionForm({ onCreated }: { onCreated?: () => void }) {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedTier, setSelectedTier] = useState<'SCHOOL' | 'COLLEGE' | 'COMPETITIVE' | 'ALL'>('SCHOOL');
  const [schoolBoard, setSchoolBoard] = useState('ALL');
  const [schoolClass, setSchoolClass] = useState('ALL');
  const [degreeMajor, setDegreeMajor] = useState('ALL');
  const [syllabusType, setSyllabusType] = useState<'ALL' | 'STANDARD' | 'UGC_MODEL' | 'CUSTOM_UNIVERSITY'>('ALL');
  const [universityName, setUniversityName] = useState('ALL');
  const [competitiveExam, setCompetitiveExam] = useState('ALL');

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

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  const [questionType, setQuestionType] = useState<'MCQ' | 'SHORT_2_MARK' | 'LONG_5_MARK' | 'NAT'>('MCQ');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [markingScheme, setMarkingScheme] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [customMarks, setCustomMarks] = useState<number>(1);

  // Competitive Exam & PYQ / Future Probable fields
  const [examName, setExamName] = useState('');
  const [paperYear, setPaperYear] = useState<string>('');
  const [isProbableFuture, setIsProbableFuture] = useState(false);
  const [predictionRationale, setPredictionRationale] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, oRes] = await Promise.all([
          fetch('/api/curriculum'),
          fetch('/api/curriculum/options'),
        ]);

        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.subjects && cData.subjects.length > 0) {
            setSubjects(cData.subjects);
          }
        }

        if (oRes.ok) {
          const oData = await oRes.json();
          if (oData.options) {
            setOptions(oData.options);
          }
        }
      } catch (err) {
        console.error('Error loading curriculum hierarchy in Add Question:', err);
      }
    }
    loadData();
  }, []);

  const filteredSubjects = subjects.filter((s) => {
    // 1. Tier Filter
    if (selectedTier !== 'ALL') {
      const sTier = (s.tier || 'SCHOOL').toUpperCase();
      if (sTier !== selectedTier) return false;
    }

    // 2. Track-Specific Sub-Hierarchy Filter
    if (selectedTier === 'SCHOOL') {
      if (schoolBoard !== 'ALL' && s.board && s.board.toLowerCase() !== schoolBoard.toLowerCase()) {
        return false;
      }
      if (schoolClass !== 'ALL' && s.class && s.class.toLowerCase() !== schoolClass.toLowerCase()) {
        return false;
      }
    } else if (selectedTier === 'COLLEGE') {
      if (degreeMajor !== 'ALL' && degreeMajor.trim()) {
        const dLower = degreeMajor.toLowerCase();
        const sMajor = (s.degreeMajor || '').toLowerCase();
        if (!sMajor.includes(dLower) && !dLower.includes(sMajor)) {
          return false;
        }
      }
      if (syllabusType !== 'ALL' && s.syllabusType && s.syllabusType !== syllabusType) {
        return false;
      }
      if (universityName !== 'ALL' && universityName.trim()) {
        const uLower = universityName.toLowerCase();
        const sUni = (s.universityName || '').toLowerCase();
        if (!sUni.includes(uLower) && !uLower.includes(sUni)) {
          return false;
        }
      }
    } else if (selectedTier === 'COMPETITIVE') {
      if (competitiveExam !== 'ALL' && competitiveExam.trim()) {
        const eLower = competitiveExam.toLowerCase();
        const sName = (s.name || '').toLowerCase();
        const sClass = (s.class || '').toLowerCase();
        if (!sName.includes(eLower) && !sClass.includes(eLower)) {
          return false;
        }
      }
    }

    return true;
  });

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      if (!filteredSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(filteredSubjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [selectedTier, schoolBoard, schoolClass, degreeMajor, syllabusType, universityName, competitiveExam, subjects]);

  const activeSubject = filteredSubjects.find((s) => s.id === selectedSubjectId) || subjects.find((s) => s.id === selectedSubjectId);
  const activeChapters = activeSubject?.chapters || [];

  useEffect(() => {
    if (activeChapters.length > 0) setSelectedChapterId(activeChapters[0].id);
    else setSelectedChapterId('');
  }, [selectedSubjectId, activeChapters]);

  const activeChapter = activeChapters.find((c) => c.id === selectedChapterId);
  const activeTopics = activeChapter?.topics || [];

  useEffect(() => {
    if (activeTopics.length > 0) setSelectedTopicId(activeTopics[0].id);
    else setSelectedTopicId('');
  }, [selectedChapterId, activeTopics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !questionText) return;

    setSubmitting(true);
    setMessage('');
    setError('');

    const targetMarks = customMarks ? Number(customMarks) : (questionType === 'MCQ' ? 1 : questionType === 'SHORT_2_MARK' ? 2 : questionType === 'NAT' ? 2 : 5);

    try {
      const res = await fetch('/api/questions/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicId,
          questionType,
          questionText,
          optionA: questionType === 'MCQ' ? optionA : undefined,
          optionB: questionType === 'MCQ' ? optionB : undefined,
          optionC: questionType === 'MCQ' ? optionC : undefined,
          optionD: questionType === 'MCQ' ? optionD : undefined,
          correctAnswer: questionType === 'MCQ' ? Number(correctAnswer) : undefined,
          expectedAnswer: questionType !== 'MCQ' ? expectedAnswer : undefined,
          markingScheme: questionType !== 'MCQ' ? markingScheme : undefined,
          explanation,
          difficulty,
          marks: targetMarks,
          examName: examName || undefined,
          paperYear: paperYear ? Number(paperYear) : undefined,
          isProbableFuture,
          predictionRationale: isProbableFuture ? predictionRationale : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save question');
        setSubmitting(false);
        return;
      }

      setMessage(`✅ ${questionType} question created and added to approved Question Bank!`);
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setExpectedAnswer('');
      setMarkingScheme('');
      setExplanation('');
      setExamName('');
      setPaperYear('');
      setIsProbableFuture(false);
      setPredictionRationale('');
      if (onCreated) onCreated();
    } catch (err) {
      setError('Connection error creating manual question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            Admin Manual Question Creation System
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manually create syllabus-aligned MCQs (1 Mark), Short Questions (2 Marks), Long Questions (5 Marks), and NAT Questions.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* SYLLABUS SOURCES HIERARCHY MATCHING SYSTEM */}
      <div className="space-y-4">
        {/* Tier Selection - exact match with Syllabus Sources */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Institution Track / Academic Level
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTier('SCHOOL')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                selectedTier === 'SCHOOL'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              School (K-12)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('COLLEGE')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                selectedTier === 'COLLEGE'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              College (UG / PG)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('COMPETITIVE')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                selectedTier === 'COMPETITIVE'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Competitive Entrance
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('ALL')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                selectedTier === 'ALL'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              All Subjects
            </button>
          </div>
        </div>

        {/* School-specific hierarchy sub-fields: Board + Class */}
        {selectedTier === 'SCHOOL' && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Board</label>
              <select
                value={schoolBoard}
                onChange={(e) => setSchoolBoard(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="ALL">All Boards</option>
                {options.schoolBoards.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Class / Grade</label>
              <select
                value={schoolClass}
                onChange={(e) => setSchoolClass(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="ALL">All Classes</option>
                {options.schoolClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* College-specific hierarchy sub-fields: Degree / Major + Syllabus Model + University */}
        {selectedTier === 'COLLEGE' && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Degree / Major</label>
              <select
                value={degreeMajor}
                onChange={(e) => setDegreeMajor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="ALL">All Majors</option>
                {options.collegeMajors.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Syllabus Model</label>
              <select
                value={syllabusType}
                onChange={(e) => setSyllabusType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="ALL">All Models</option>
                <option value="UGC_MODEL">UGC Model Syllabus</option>
                <option value="CUSTOM_UNIVERSITY">Custom University</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">University Name</label>
              <select
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="ALL">All Universities</option>
                {options.universities.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Competitive-specific hierarchy sub-fields: Exam Selection */}
        {selectedTier === 'COMPETITIVE' && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Target Entrance Exam</label>
            <select
              value={competitiveExam}
              onChange={(e) => {
                setCompetitiveExam(e.target.value);
                if (e.target.value !== 'ALL') setExamName(e.target.value);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="ALL">All Entrance Exams (GATE, NExT, CET, CAT)</option>
              {options.competitiveExams.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>
        )}

        {/* Cascaded Curriculum Tree Selectors: Subject -> Chapter -> Topic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                Subject ({filteredSubjects.length})
              </span>
              {filteredSubjects.length === 0 && (
                <span className="text-[10px] text-amber-400">0 found in filter</span>
              )}
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
            >
              {filteredSubjects.length === 0 ? (
                <option value="">No subjects match this filter</option>
              ) : (
                filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.degreeMajor ? `(${s.degreeMajor})` : s.class ? `(${s.class} • ${s.board || 'CBSE'})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Chapter ({activeChapters.length})
            </label>
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
            >
              {activeChapters.length === 0 ? (
                <option value="">No chapters in subject</option>
              ) : (
                activeChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Topic ({activeTopics.length})
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
            >
              {activeTopics.length === 0 ? (
                <option value="">No topics in chapter</option>
              ) : (
                activeTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Question Type & Difficulty Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Question Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setQuestionType('MCQ');
                setCustomMarks(1);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                questionType === 'MCQ'
                  ? 'bg-sky-500 text-white border-sky-400 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              MCQ (1M)
            </button>
            <button
              type="button"
              onClick={() => {
                setQuestionType('SHORT_2_MARK');
                setCustomMarks(2);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                questionType === 'SHORT_2_MARK'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Short (2M)
            </button>
            <button
              type="button"
              onClick={() => {
                setQuestionType('LONG_5_MARK');
                setCustomMarks(5);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                questionType === 'LONG_5_MARK'
                  ? 'bg-purple-600 text-white border-purple-400 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Long (5M)
            </button>
            <button
              type="button"
              onClick={() => {
                setQuestionType('NAT');
                setCustomMarks(2);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                questionType === 'NAT'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              NAT (2M)
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Marks Assigned:
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={customMarks}
              onChange={(e) => setCustomMarks(Math.max(1, Number(e.target.value)))}
              className="w-24 bg-slate-950 border border-slate-700 text-sky-400 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="Marks"
            />
            <span className="text-[11px] text-slate-500">
              (Admin can set custom marks e.g. 1, 2, 5, or custom)
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Easy', 'Medium', 'Hard'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  difficulty === lvl
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Text Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Question Text
        </label>
        <textarea
          rows={3}
          required
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="e.g. State Ohm's Law and write its mathematical formula relating V, I, and R."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
        />
      </div>

      {/* MCQ Fields */}
      {questionType === 'MCQ' && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider">
            MCQ Options & Correct Choice
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">Option A</span>
              <input
                type="text"
                required
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="Option A"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">Option B</span>
              <input
                type="text"
                required
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="Option B"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">Option C</span>
              <input
                type="text"
                required
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                placeholder="Option C"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">Option D</span>
              <input
                type="text"
                required
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                placeholder="Option D"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 mt-2">
              Correct Option
            </label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            >
              <option value={0}>Option A</option>
              <option value={1}>Option B</option>
              <option value={2}>Option C</option>
              <option value={3}>Option D</option>
            </select>
          </div>
        </div>
      )}

      {/* NAT (Numerical Answer Type) Field */}
      {questionType === 'NAT' && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Numerical Target Value / Range
            </label>
            <input
              type="text"
              required
              value={expectedAnswer}
              onChange={(e) => setExpectedAnswer(e.target.value)}
              placeholder="e.g. 42.5 (Automated grading evaluates within ±0.05 tolerance)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 2-Mark & 5-Mark Descriptive Fields */}
      {(questionType === 'SHORT_2_MARK' || questionType === 'LONG_5_MARK') && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
              Model Expected Answer
            </label>
            <textarea
              rows={3}
              required
              value={expectedAnswer}
              onChange={(e) => setExpectedAnswer(e.target.value)}
              placeholder="Provide comprehensive model answer for evaluation comparison..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
              Marking Scheme / Concept Guidelines
            </label>
            <textarea
              rows={2}
              value={markingScheme}
              onChange={(e) => setMarkingScheme(e.target.value)}
              placeholder="e.g. 1 mark for correct definition statement with constant temperature condition. 1 mark for formula V=IR."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Competitive Exam & PYQ / Future Probable Metadata */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider">
          Competitive Exam / PYQ / Future Probable Metadata (Optional)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Target Exam (GATE, NExT, CET, CAT)</label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. GATE CS, CAT, NExT, MHT-CET"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Paper Year (For PYQs)</label>
            <input
              type="number"
              value={paperYear}
              onChange={(e) => setPaperYear(e.target.value)}
              placeholder="e.g. 2023"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isProbableFuture}
              onChange={(e) => setIsProbableFuture(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700 focus:ring-purple-500"
            />
            <span className="text-xs text-slate-300 font-semibold">
              Mark as Future Probable / Trend-Predicted Question
            </span>
          </label>
          {isProbableFuture && (
            <div className="mt-2">
              <label className="block text-xs text-slate-400 mb-1">Prediction Rationale / Trend Justification</label>
              <textarea
                rows={2}
                value={predictionRationale}
                onChange={(e) => setPredictionRationale(e.target.value)}
                placeholder="e.g. High recurring frequency in past 4 years; shifts towards pipeline hazard edge cases."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Educational Explanation */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Educational Explanation
        </label>
        <textarea
          rows={2}
          required
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Detailed explanation for student review..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !selectedTopicId}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Saving Question...</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span>Save Question to Approved Bank</span>
          </>
        )}
      </button>
    </form>
  );
}
