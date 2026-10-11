'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Layers, BookOpen, FileText, BarChart2, GraduationCap, School, HelpCircle } from 'lucide-react';

export interface SubjectItem {
  id: string;
  name: string;
  class: string;
  board: string;
  tier?: string;
  degreeMajor?: string | null;
  syllabusType?: string | null;
  universityName?: string | null;
  semester?: number | null;
  chapters: {
    id: string;
    name: string;
    topics: {
      id: string;
      name: string;
    }[];
  }[];
}

export interface GenerationSelection {
  tier: string;
  exam: string;
  classLevel: string;
  board: string;
  degreeMajor?: string;
  syllabusType?: string;
  universityName?: string;
  semester?: number;
  generationMode: string;
  examName?: string;
  targetYear?: number;
  subjectId: string;
  chapterId: string;
  topicId: string;
  difficulty: string;
  questionType: 'MCQ' | 'SHORT_2_MARK' | 'LONG_5_MARK' | 'NAT';
  count: number;
  numberOfQuestions: number;
}

interface TopicSelectorProps {
  onGenerate: (selection: GenerationSelection) => void;
  loading?: boolean;
}

export default function TopicSelector({ onGenerate, loading = false }: TopicSelectorProps) {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [fetchingCurriculum, setFetchingCurriculum] = useState(true);

  // High-level Tier: SCHOOL, COLLEGE, COMPETITIVE
  const [tier, setTier] = useState<'SCHOOL' | 'COLLEGE' | 'COMPETITIVE'>('SCHOOL');

  // Competitive exam specifics
  const [competitiveExam, setCompetitiveExam] = useState('');
  const [generationMode, setGenerationMode] = useState<'STANDARD' | 'PYQ' | 'FUTURE_PROBABLE'>('STANDARD');
  const [targetYear, setTargetYear] = useState<number>(2024);

  // College specific state
  const [collegeProgram, setCollegeProgram] = useState<'UG' | 'PG'>('UG');
  const [degreeMajor, setDegreeMajor] = useState('');
  const [syllabusType, setSyllabusType] = useState<'UGC_MODEL' | 'CUSTOM_UNIVERSITY'>('UGC_MODEL');
  const [universityName, setUniversityName] = useState('');
  const [semester, setSemester] = useState<number>(1);

  // School Form State
  const [exam, setExam] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [board, setBoard] = useState('');

  // Curriculum Cascade
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState<'MCQ' | 'SHORT_2_MARK' | 'LONG_5_MARK' | 'NAT'>('MCQ');
  const [questionCount, setQuestionCount] = useState(5);

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

  const [userProfile, setUserProfile] = useState<{
    role: string;
    institutionType?: string;
    class?: string;
    board?: string;
    degreeMajor?: string;
    universityName?: string;
    semester?: number;
  } | null>(null);

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const [cRes, oRes] = await Promise.all([
          fetch('/api/curriculum'),
          fetch('/api/curriculum/options'),
        ]);

        const data = await cRes.json();
        const optData = await oRes.json();

        if (optData.options) {
          const opts = optData.options;
          setOptions(opts);

          // If no user profile data set yet, seed with first real DB values
          if (!data.userProfile) {
            if (opts.schoolClasses.length > 0) setClassLevel(opts.schoolClasses[0]);
            if (opts.schoolBoards.length > 0) {
              setBoard(opts.schoolBoards[0]);
              setExam(`${opts.schoolBoards[0]} Board Exam`);
            }
            if (opts.collegeMajors.length > 0) setDegreeMajor(opts.collegeMajors[0]);
            if (opts.universities.length > 0) setUniversityName(opts.universities[0]);
            if (opts.competitiveExams.length > 0) setCompetitiveExam(opts.competitiveExams[0]);
          }
        }

        if (data.subjects && data.subjects.length > 0) {
          setSubjects(data.subjects);
          setSelectedSubjectId(data.subjects[0].id);
        }

        if (data.userProfile) {
          setUserProfile(data.userProfile);
          if (data.userProfile.institutionType) {
            setTier(data.userProfile.institutionType as any);
          }
          if (data.userProfile.board) {
            setBoard(data.userProfile.board);
            setExam(`${data.userProfile.board} Board Exam`);
          }
          if (data.userProfile.class) {
            setClassLevel(data.userProfile.class);
          }
          if (data.userProfile.degreeMajor) {
            setDegreeMajor(data.userProfile.degreeMajor);
          }
          if (data.userProfile.universityName) {
            setUniversityName(data.userProfile.universityName);
          }
          if (data.userProfile.semester) {
            setSemester(data.userProfile.semester);
          }
        }
      } catch (err) {
        console.error('Failed to load curriculum', err);
      } finally {
        setFetchingCurriculum(false);
      }
    }
    loadCurriculum();
  }, []);

  const isStudent = userProfile?.role?.toUpperCase() === 'STUDENT';
  const allowedTier = userProfile?.institutionType;

  // Filter subjects matching current tier, class, and board
  const filteredSubjects = subjects.filter((s) => {
    const sTier = (s.tier || 'SCHOOL').toUpperCase();
    if (tier === 'SCHOOL') {
      if (sTier !== 'SCHOOL') return false;
      if (classLevel && s.class && s.class.toLowerCase() !== classLevel.toLowerCase()) {
        return false;
      }
      if (board && s.board && s.board.toLowerCase() !== board.toLowerCase()) {
        return false;
      }
      return true;
    }
    if (tier === 'COLLEGE') {
      if (sTier !== 'COLLEGE') return false;
      if (degreeMajor && s.degreeMajor) {
        const dLower = degreeMajor.toLowerCase();
        const sLower = s.degreeMajor.toLowerCase();
        if (!sLower.includes(dLower) && !dLower.includes(sLower)) return false;
      }
      return true;
    }
    if (tier === 'COMPETITIVE') {
      if (sTier !== 'COMPETITIVE') return false;
      if (competitiveExam) {
        const eLower = competitiveExam.toLowerCase();
        const sName = (s.name || '').toLowerCase();
        const sClass = (s.class || '').toLowerCase();
        if (!sName.includes(eLower) && !sClass.includes(eLower)) return false;
      }
      return true;
    }
    return true;
  });

  // Display subjects: strict filter if found, otherwise all subjects for this tier so student is never empty
  const displaySubjects =
    filteredSubjects.length > 0
      ? filteredSubjects
      : subjects.filter((s) => {
          const sTier = (s.tier || 'SCHOOL').toUpperCase();
          return tier === 'SCHOOL' ? (sTier === 'SCHOOL' || !s.tier) : sTier === tier;
        });

  const activeSubject =
    displaySubjects.find((s) => s.id === selectedSubjectId) ||
    displaySubjects[0] ||
    subjects.find((s) => s.id === selectedSubjectId);

  useEffect(() => {
    if (displaySubjects.length > 0 && !displaySubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(displaySubjects[0].id);
    }
  }, [tier, classLevel, board, degreeMajor, displaySubjects]);

  const activeChapters = activeSubject?.chapters || [];

  useEffect(() => {
    if (activeChapters.length > 0) {
      setSelectedChapterId(activeChapters[0].id);
    } else {
      setSelectedChapterId('');
    }
  }, [activeSubject, activeChapters]);

  const activeChapter = activeChapters.find((c) => c.id === selectedChapterId);
  const activeTopics = activeChapter?.topics || [];

  useEffect(() => {
    if (activeTopics.length > 0) {
      setSelectedTopicId(activeTopics[0].id);
    } else {
      setSelectedTopicId('');
    }
  }, [selectedChapterId, activeTopics]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedChapterId || !selectedTopicId) return;

    onGenerate({
      tier,
      exam: tier === 'COMPETITIVE' ? competitiveExam : exam,
      classLevel: tier === 'COLLEGE' ? collegeProgram : classLevel,
      board: tier === 'COLLEGE' ? (syllabusType === 'UGC_MODEL' ? 'UGC' : universityName) : board,
      degreeMajor: tier === 'COLLEGE' ? degreeMajor : undefined,
      syllabusType: tier === 'COLLEGE' ? syllabusType : undefined,
      universityName: tier === 'COLLEGE' && syllabusType === 'CUSTOM_UNIVERSITY' ? universityName : undefined,
      semester: tier === 'COLLEGE' ? semester : undefined,
      generationMode,
      examName: tier === 'COMPETITIVE' ? competitiveExam : undefined,
      targetYear: generationMode === 'PYQ' ? targetYear : undefined,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      topicId: selectedTopicId,
      difficulty,
      questionType,
      count: Number(questionCount),
      numberOfQuestions: Number(questionCount),
    });
  };

  if (fetchingCurriculum) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 gap-2">
        <Sparkles className="w-5 h-5 animate-spin text-sky-400" />
        <span>Loading Curriculum & AI Configuration...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gemini AI Question Generator</h2>
            <p className="text-xs text-slate-400">Powered by Google Gemini 2.5 Flash API • Dynamic Syllabus & Schema Validation</p>
          </div>
        </div>
      </div>

      {/* Academic Tier Tabs */}
      <div className={`grid gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 ${isStudent ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {(!isStudent || allowedTier === 'SCHOOL') && (
          <button
            type="button"
            onClick={() => setTier('SCHOOL')}
            className={`py-3 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              tier === 'SCHOOL'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <School className="w-4 h-4" />
            <span>School (K-12 Track)</span>
          </button>
        )}

        {(!isStudent || allowedTier === 'COLLEGE') && (
          <button
            type="button"
            onClick={() => setTier('COLLEGE')}
            className={`py-3 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              tier === 'COLLEGE'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>College (UG / PG Track)</span>
          </button>
        )}

        {(!isStudent || allowedTier === 'COMPETITIVE') && (
          <button
            type="button"
            onClick={() => setTier('COMPETITIVE')}
            className={`py-3 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              tier === 'COMPETITIVE'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Competitive Exam Track (GATE / NExT / CET / CAT)</span>
          </button>
        )}
      </div>

      {/* TIER 1: SCHOOL CONTROLS (Only visible to admin / guest; hidden for students as track is configured in profile settings) */}
      {tier === 'SCHOOL' && !isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
              School Target
            </label>
            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="CBSE Board Exam">CBSE Board Exam</option>
              <option value="ICSE / ISC Exam">ICSE / ISC Exam</option>
              <option value="State Board Exam">State Board Exam</option>
              <option value="School Unit Test">School Unit Test</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-blue-400" />
              Class / Grade
            </label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {(options.schoolClasses && options.schoolClasses.length > 0
                ? options.schoolClasses
                : ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
              ).map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Board
            </label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {(options.schoolBoards && options.schoolBoards.length > 0
                ? options.schoolBoards
                : ['CBSE', 'ICSE', 'State Board']
              ).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* TIER 2: COLLEGE (UG / PG) CONTROLS */}
      {tier === 'COLLEGE' && (
        <div className="space-y-4 p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                Level
              </label>
              <select
                value={collegeProgram}
                onChange={(e) => setCollegeProgram(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="UG">Undergraduate (UG)</option>
                <option value="PG">Postgraduate (PG)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                Major / Degree Branch
              </label>
              <select
                value={degreeMajor}
                onChange={(e) => setDegreeMajor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {options.collegeMajors.length === 0 ? (
                  <option value="">No majors configured in DB yet</option>
                ) : (
                  options.collegeMajors.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                Syllabus Standard
              </label>
              <select
                value={syllabusType}
                onChange={(e) => setSyllabusType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="UGC_MODEL">UGC Model Curriculum (National Benchmark)</option>
                <option value="CUSTOM_UNIVERSITY">Custom University Syllabus</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {syllabusType === 'CUSTOM_UNIVERSITY' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                University Name / Affiliated Council
              </label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                placeholder="e.g. Delhi University, Anna University, VTU, MAKAUT, Mumbai University"
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* TIER 3: COMPETITIVE ENTRANCE (GATE, NExT, CET, CAT) */}
      {tier === 'COMPETITIVE' && (
        <div className="space-y-4 p-4 rounded-xl bg-slate-950/60 border border-amber-500/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
                Target Entrance Exam
              </label>
              {options.competitiveExams.length === 0 ? (
                <p className="text-xs text-amber-400/70 italic col-span-full">
                  No competitive exams configured by admin yet. Add them via the Curriculum Tree.
                </p>
              ) : (
                <div className={`grid gap-1.5 ${options.competitiveExams.length <= 4 ? 'grid-cols-' + options.competitiveExams.length : 'grid-cols-4'}`}>
                  {options.competitiveExams.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setCompetitiveExam(ex)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                        competitiveExam === ex
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
                Extraction & Prediction Mode
              </label>
              <select
                value={generationMode}
                onChange={(e) => setGenerationMode(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
              >
                <option value="STANDARD">Syllabus-Aligned Practice</option>
                <option value="PYQ">Previous Year Questions (PYQs 2018-2024)</option>
                <option value="FUTURE_PROBABLE">🔮 Future Probable Questions (Trend Prediction)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
                {generationMode === 'PYQ' ? 'Target Paper Year' : 'Trend Benchmark'}
              </label>
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} Paper Pattern
                  </option>
                ))}
              </select>
            </div>
          </div>

          {generationMode === 'FUTURE_PROBABLE' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Predictive Mode Activated:</strong> Gemini analyzes recurring high-yield question patterns from past papers and synthesizes brand-new probable questions with trend rationales.
              </span>
            </div>
          )}

          {generationMode === 'PYQ' && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>
                <strong>Authentic Paper Re-creation:</strong> Extracts official past paper question styles with rigorous technical edge-cases and marking schemes.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Row 2: Subject, Chapter, Topic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800/80 pt-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
          >
            {displaySubjects.length > 0 ? (
              displaySubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.tier || 'School'} - {sub.class})
                </option>
              ))
            ) : (
              <option value="">No subjects found for this tier</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Chapter / Module
          </label>
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
          >
            {activeChapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            Topic
          </label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
          >
            {activeTopics.map((top) => (
              <option key={top.id} value={top.id}>
                {top.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Question Format, Difficulty, Count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
            Question Type
          </label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
          >
            <option value="MCQ">Multiple Choice (1 Mark)</option>
            <option value="SHORT_2_MARK">Short Descriptive (2 Marks)</option>
            <option value="LONG_5_MARK">Long Answer (5 Marks)</option>
            {tier === 'COMPETITIVE' && (
              <option value="NAT">Numerical Answer Type (NAT - 2 Marks)</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Easy', 'Medium', 'Hard'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  difficulty === lvl
                    ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-750'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Number of Questions</span>
            <span className="text-[10px] text-sky-400 font-bold">Custom field enabled</span>
          </label>
          <div className="flex gap-2">
            <select
              value={[3, 5, 10, 15, 20].includes(Number(questionCount)) ? questionCount : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setQuestionCount(Number(e.target.value));
                }
              }}
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions (Standard)</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
              <option value="custom">Custom count...</option>
            </select>
            <div className="w-28 relative">
              <input
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                placeholder="Qty"
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none text-center"
                title="Enter custom number of questions (1-50)"
              />
              <span className="absolute right-2 top-3 text-[10px] text-slate-500 pointer-events-none">
                qty
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading || !selectedTopicId}
          className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>Generating personalized questions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Questions with AI</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
