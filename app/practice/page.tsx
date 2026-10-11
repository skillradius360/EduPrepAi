'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import TopicSelector from '@/components/TopicSelector';
import { QuestionData } from '@/components/QuestionCard';
import { Sparkles, AlertCircle } from 'lucide-react';

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    const subjectId = searchParams.get('subjectId');
    const chapterId = searchParams.get('chapterId');
    const topicId = searchParams.get('topicId');
    const difficulty = searchParams.get('difficulty') || 'Medium';
    const questionType = (searchParams.get('questionType') as any) || 'MCQ';
    const count = Number(searchParams.get('count')) || 5;

    const tier = searchParams.get('tier') || undefined;
    const exam = searchParams.get('exam') || undefined;
    const classLevel = searchParams.get('classLevel') || undefined;
    const board = searchParams.get('board') || undefined;
    const degreeMajor = searchParams.get('degreeMajor') || undefined;
    const syllabusType = searchParams.get('syllabusType') || undefined;
    const universityName = searchParams.get('universityName') || undefined;
    const semester = searchParams.get('semester') ? Number(searchParams.get('semester')) : undefined;
    const generationMode = searchParams.get('generationMode') || undefined;
    const examName = searchParams.get('examName') || undefined;
    const targetYear = searchParams.get('targetYear') ? Number(searchParams.get('targetYear')) : undefined;

    if (subjectId && chapterId && topicId) {
      handleGenerateQuestions({
        subjectId,
        chapterId,
        topicId,
        difficulty,
        questionType,
        count,
        tier,
        exam,
        classLevel,
        board,
        degreeMajor,
        syllabusType,
        universityName,
        semester,
        generationMode,
        examName,
        targetYear,
      });
    }
  }, [searchParams]);

  const handleGenerateQuestions = async (params: any) => {
    setLoading(true);
    setError('');
    setFallbackMessage('');
    setIsFallback(false);

    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to generate questions');
        setLoading(false);
        return;
      }

      const generatedQuestions: QuestionData[] = data.questions || [];
      const questionIds = generatedQuestions.map((q) => q.id).filter((id): id is string => Boolean(id));

      if (questionIds.length === 0 || questionIds.length !== generatedQuestions.length) {
        setError('Generated questions could not be saved for an exam attempt. Please try again.');
        setLoading(false);
        return;
      }

      setIsFallback(data.isFallback || false);
      if (data.isFallback && data.message) {
        setFallbackMessage(data.message);
      }

      const testRes = await fetch('/api/tests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: params.subjectId,
          topicId: params.topicId,
          title: `${data.subjectName || 'Practice'} ${params.questionType || 'MCQ'} Exam`,
          duration: Math.max(5, Math.ceil(params.count * 1.5)),
          questionIds,
        }),
      });

      const testData = await testRes.json();
      if (!testRes.ok || !testData.testId) {
        setError(testData.error || 'Failed to open the generated exam.');
        setLoading(false);
        return;
      }

      router.push(`/test/${testData.testId}`);
    } catch (err) {
      setError('Unable to generate questions right now. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            AI Practice Mode
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supports MCQs (1 Mark), Short Answer (2 Marks), and Long Descriptive Questions (5 Marks).
          </p>
        </div>

      </div>

      {isFallback && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-bold">AI Fallback Mode Active</p>
            <p className="mt-0.5 opacity-90">{fallbackMessage || 'Approved question bank items are being used because live AI generation is temporarily unavailable.'}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <TopicSelector onGenerate={handleGenerateQuestions} loading={loading} />
    </div>
  );
}

export default function PracticePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex-1 flex">
        <Sidebar role="STUDENT" isOpen={isSidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading AI Practice...</div>}>
            <PracticeContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
