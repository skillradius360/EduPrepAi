'use client';

import React, { useState, useEffect } from 'react';
import { Search, Globe, CheckCircle2, ShieldCheck, Sparkles, AlertCircle, ExternalLink, FilePlus, Plus, Trash2 } from 'lucide-react';

interface SourceItem {
  id: string;
  board: string;
  class: string;
  subject: string;
  sourceName: string;
  sourceUrl: string;
  content: string;
  status: string;
  retrievedAt: string;
}

interface ChapterEntry {
  name: string;
  content: string;
}

interface CurriculumSubject {
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
    topics: { id: string; name: string }[];
  }[];
}

export default function AdminSyllabusResearch() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState<CurriculumSubject[]>([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [board, setBoard] = useState('');
  const [className, setClassName] = useState('');
  const [tier, setTier] = useState<'SCHOOL' | 'COLLEGE' | 'COMPETITIVE'>('SCHOOL');
  const [degreeMajor, setDegreeMajor] = useState('');
  const [syllabusType, setSyllabusType] = useState<'STANDARD' | 'UGC_MODEL' | 'CUSTOM_UNIVERSITY' | 'PYQ_OFFICIAL'>('STANDARD');
  const [universityName, setUniversityName] = useState('');
  const [query, setQuery] = useState('');
  const [chapters, setChapters] = useState('');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterEntries, setChapterEntries] = useState<ChapterEntry[]>([]);

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

  const [researching, setResearching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [srcRes, currRes, optRes] = await Promise.all([
        fetch('/api/syllabus/research'),
        fetch('/api/curriculum'),
        fetch('/api/curriculum/options'),
      ]);

      if (srcRes.ok) {
        const sData = await srcRes.json();
        if (sData.sources) setSources(sData.sources);
      }
      if (currRes.ok) {
        const cData = await currRes.json();
        if (cData.subjects) setCurriculumSubjects(cData.subjects);
      }
      if (optRes.ok) {
        const oData = await optRes.json();
        if (oData.options) {
          const opts = oData.options;
          setOptions(opts);
          // Seed defaults from first real DB values — never hardcoded
          if (opts.schoolBoards.length > 0) setBoard(opts.schoolBoards[0]);
          if (opts.schoolClasses.length > 0) setClassName(opts.schoolClasses[0]);
          if (opts.collegeMajors.length > 0) setDegreeMajor(opts.collegeMajors[0]);
          if (opts.universities.length > 0) setUniversityName(opts.universities[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load syllabus research data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'manual' && !subject.trim()) {
      setError('Subject is required for manual entry');
      return;
    }

    if (mode === 'manual' && chapterEntries.length === 0) {
      setError('Add at least one chapter with content before saving');
      return;
    }

    setResearching(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/syllabus/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          board: tier === 'COLLEGE' ? 'University' : tier === 'COMPETITIVE' ? 'National' : board,
          className: tier === 'COLLEGE' ? 'UG/PG' : tier === 'COMPETITIVE' ? 'Entrance' : className,
          tier,
          degreeMajor: tier === 'COLLEGE' ? degreeMajor : undefined,
          syllabusType: tier === 'COLLEGE' ? syllabusType : 'STANDARD',
          universityName: tier === 'COLLEGE' && syllabusType === 'CUSTOM_UNIVERSITY' ? universityName : undefined,
          subject,
          query,
          chapters,
          chapterEntries,
          sourceName,
          sourceUrl,
          content:
            manualContent ||
            chapterEntries
              .map((chapter) => `${chapter.name}\n${chapter.content}`)
              .join('\n\n'),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Research retrieval failed');
        setResearching(false);
        return;
      }

      const addedSubjects = Array.isArray(data.curriculum)
        ? data.curriculum.map((item: { subject?: string }) => item.subject).filter(Boolean).join(', ')
        : '';
      setMessage(
        mode === 'manual'
          ? `Manual syllabus source added for ${board} ${className} ${subject}.`
          : `Verified official syllabus source retrieved and linked for ${board} ${className}${addedSubjects ? `: ${addedSubjects}` : ''}.`
      );
      if (mode === 'manual') {
        setSourceName('');
        setSourceUrl('');
        setManualContent('');
        setChapters('');
        setChapterName('');
        setChapterContent('');
        setChapterEntries([]);
      }
      loadData();
    } catch (err) {
      setError('Connection error retrieving syllabus data');
    } finally {
      setResearching(false);
    }
  };

  const handleAddChapter = () => {
    const name = chapterName.trim();
    const content = chapterContent.trim();

    if (!name || !content) {
      setError('Chapter name and content are required');
      return;
    }

    const nextEntries = [...chapterEntries, { name, content }];
    setChapterEntries(nextEntries);
    setChapters(nextEntries.map((chapter) => chapter.name).join('\n'));
    setChapterName('');
    setChapterContent('');
    setError('');
  };

  const handleRemoveChapter = (index: number) => {
    const nextEntries = chapterEntries.filter((_, itemIndex) => itemIndex !== index);
    setChapterEntries(nextEntries);
    setChapters(nextEntries.map((chapter) => chapter.name).join('\n'));
  };

  const matchingCurriculumSubjects = curriculumSubjects.filter((cs) => {
    const csTier = (cs.tier || 'SCHOOL').toUpperCase();
    if (csTier !== tier) return false;
    if (tier === 'SCHOOL') {
      if (className && cs.class && cs.class.toLowerCase() !== className.toLowerCase()) return false;
      if (board && cs.board && cs.board.toLowerCase() !== board.toLowerCase()) return false;
    } else if (tier === 'COLLEGE') {
      if (degreeMajor && cs.degreeMajor) {
        if (!cs.degreeMajor.toLowerCase().includes(degreeMajor.toLowerCase()) && !degreeMajor.toLowerCase().includes(cs.degreeMajor.toLowerCase())) {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-400" />
            Indian Syllabus Research & Web Source Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Retrieve and verify official syllabus guidelines from CBSE/NCERT to guide AI question generation.
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
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
        <button
          type="button"
          onClick={() => setMode('auto')}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
            mode === 'auto' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Auto Retrieve Syllabus
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
            mode === 'manual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FilePlus className="w-4 h-4" />
          Add Syllabus By Hand
        </button>
      </div>

      {/* Tier Selection */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTier('SCHOOL')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
            tier === 'SCHOOL'
              ? 'bg-sky-500 text-white border-sky-400 shadow'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          School (K-12)
        </button>
        <button
          type="button"
          onClick={() => setTier('COLLEGE')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
            tier === 'COLLEGE'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          College (UG / PG)
        </button>
        <button
          type="button"
          onClick={() => setTier('COMPETITIVE')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
            tier === 'COMPETITIVE'
              ? 'bg-purple-600 text-white border-purple-400 shadow'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          Competitive Entrance
        </button>
      </div>

      {/* College specific options */}
      {tier === 'COLLEGE' && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Degree / Major</label>
            <input
              type="text"
              value={degreeMajor}
              onChange={(e) => setDegreeMajor(e.target.value)}
              placeholder="e.g. B.Tech CSE, B.Sc Physics"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Syllabus Model</label>
            <select
              value={syllabusType}
              onChange={(e) => setSyllabusType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="UGC_MODEL">UGC Model Syllabus</option>
              <option value="CUSTOM_UNIVERSITY">Custom University</option>
            </select>
          </div>
          {syllabusType === 'CUSTOM_UNIVERSITY' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">University Name</label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                placeholder="e.g. Delhi University / Anna University"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
          )}
        </div>
      )}

      {/* Research Request Form */}
      <form onSubmit={handleResearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
        {tier === 'SCHOOL' ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Board
              </label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              >
                {options.schoolBoards.length === 0 ? (
                  <option value="">No boards in DB yet</option>
                ) : (
                  options.schoolBoards.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Class
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              >
                {options.schoolClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Context
            </label>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              {tier === 'COLLEGE'
                ? `College: ${degreeMajor} (${syllabusType === 'UGC_MODEL' ? 'UGC Model Syllabus' : universityName || 'Custom University'})`
                : 'National Level Competitive Entrance (GATE, NExT, CET, CAT)'}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Subject {mode === 'auto' ? '(From Curriculum Tree or New)' : ''}
          </label>
          {matchingCurriculumSubjects.length > 0 && !isCustomSubject ? (
            <div className="space-y-1.5">
              <select
                value={subject}
                onChange={(e) => {
                  if (e.target.value === '__CUSTOM__') {
                    setIsCustomSubject(true);
                    setSubject('');
                  } else {
                    setSubject(e.target.value);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Choose Curriculum Tree Subject ({matchingCurriculumSubjects.length}) --</option>
                {matchingCurriculumSubjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.chapters?.length || 0} chapters, {s.chapters?.reduce((acc, c) => acc + (c.topics?.length || 0), 0) || 0} topics)
                  </option>
                ))}
                <option value="__CUSTOM__">+ Type New / Custom Subject</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <input
                type="text"
                required={mode === 'manual'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  tier === 'COLLEGE'
                    ? 'Operating Systems / DBMS'
                    : tier === 'COMPETITIVE'
                    ? 'Computer Networks / Quantitative'
                    : mode === 'auto'
                    ? 'Leave blank or type subject'
                    : 'Science / Mathematics'
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
              {matchingCurriculumSubjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomSubject(false)}
                  className="text-[11px] text-sky-400 hover:underline"
                >
                  ← Select from existing Curriculum Tree ({matchingCurriculumSubjects.length})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={researching}
            className={`w-full py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              mode === 'manual'
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
                : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/25'
            }`}
          >
            {researching ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{mode === 'manual' ? 'Saving Syllabus...' : 'Retrieving Syllabus...'}</span>
              </>
            ) : (
              <>
                {mode === 'manual' ? <FilePlus className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                <span>{mode === 'manual' ? 'Add Syllabus Source' : 'Auto Retrieve Syllabus'}</span>
              </>
            )}
          </button>
        </div>

        {mode === 'auto' && (
          <>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Retrieval Notes
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Optional: e.g. latest rationalized syllabus, chapter-wise topics"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Chapters Override
            </label>
            <textarea
              value={chapters}
              onChange={(e) => setChapters(e.target.value)}
              rows={3}
              placeholder="Optional: one chapter per line if the official page is broad or hard to parse"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white resize-y"
            />
          </div>
          </>
        )}

        {mode === 'manual' && (
          <>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Source Name
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. CBSE Science Class 10 2026 Syllabus"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Source URL
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Optional official/reference URL"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Add Chapter
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="Chapter name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
                <textarea
                  value={chapterContent}
                  onChange={(e) => setChapterContent(e.target.value)}
                  rows={3}
                  placeholder="Chapter content, topics, outcomes, marking notes"
                  className="md:col-span-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white resize-y"
                />
              </div>
              <button
                type="button"
                onClick={handleAddChapter}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Chapter
              </button>
              {chapterEntries.length > 0 && (
                <div className="mt-4 space-y-2">
                  {chapterEntries.map((chapter, index) => (
                    <div key={`${chapter.name}-${index}`} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-sky-300">{chapter.name}</p>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{chapter.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChapter(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </form>

      {/* Live Curriculum Tree Syllabus Status */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              Live Curriculum Tree Subjects & Syllabus Status ({curriculumSubjects.length})
            </h3>
            <p className="text-xs text-slate-400">
              Synced with Curriculum Tree database. Select any subject below to auto-retrieve its syllabus topics.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
            {curriculumSubjects.reduce((acc, s) => acc + (s.chapters?.length || 0), 0)} Chapters • {curriculumSubjects.reduce((acc, s) => acc + (s.chapters?.reduce((ca, c) => ca + (c.topics?.length || 0), 0) || 0), 0)} Topics
          </span>
        </div>

        {curriculumSubjects.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs rounded-xl bg-slate-950 border border-slate-800">
            No subjects in Curriculum Tree yet. Add subjects in Curriculum Tree tab or auto-retrieve above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {curriculumSubjects.map((s) => {
              const totalChaps = s.chapters?.length || 0;
              const totalTopics = s.chapters?.reduce((acc, c) => acc + (c.topics?.length || 0), 0) || 0;
              const isSelected = subject === s.name;
              return (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected ? 'bg-indigo-950/40 border-indigo-500 shadow-sm' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-white block">{s.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {s.tier || 'SCHOOL'} • {s.degreeMajor || s.class} {s.board ? `(${s.board})` : ''}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      totalTopics > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {totalTopics > 0 ? `${totalTopics} Topics` : 'Needs Topics'}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>{totalChaps} Chapters</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTier((s.tier as any) || 'SCHOOL');
                        if (s.class) setClassName(s.class);
                        if (s.board) setBoard(s.board);
                        if (s.degreeMajor) setDegreeMajor(s.degreeMajor);
                        setSubject(s.name);
                        setIsCustomSubject(false);
                      }}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Select to Retrieve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verified Sources List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Verified Syllabus Context Sources ({sources.length})
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading curriculum sources...</div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No web syllabus sources retrieved yet.</div>
        ) : (
          <div className="space-y-3">
            {sources.map((src) => (
              <div key={src.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-400">{src.sourceName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      {src.status}
                    </span>
                  </div>
                  <a
                    href={src.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <span>Visit Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                  {src.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
