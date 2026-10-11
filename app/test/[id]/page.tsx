'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard, { QuestionData } from '@/components/QuestionCard';
import { Clock, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Sparkles, LogOut } from 'lucide-react';

interface TestDetail {
  id: string;
  title: string;
  duration: number; // minutes
  subject: { name: string };
  topic: { name: string };
  testQuestions: {
    question: QuestionData & { id: string };
  }[];
}

export default function MockTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const testId = params.id;

  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600);
  const [initialTime, setInitialTime] = useState(600);

  useEffect(() => {
    async function loadTest() {
      try {
        const res = await fetch(`/api/tests/${testId}`);
        const data = await res.json();

        if (!res.ok || !data.test) {
          setError(data.error || 'Failed to load test parameters');
          setLoading(false);
          return;
        }

        setTest(data.test);
        const durationSecs = (data.test.duration || 10) * 60;
        setTimeLeftSeconds(durationSecs);
        setInitialTime(durationSecs);
      } catch (err) {
        setError('Connection error loading test.');
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [testId]);

  useEffect(() => {
    if (loading || submitting || timeLeftSeconds <= 0 || !test) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitting, timeLeftSeconds, test]);

  useEffect(() => {
    if (!test || submitting) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [test, submitting]);

  const handleSelectOption = (optionIndex: number) => {
    if (!test) return;
    const currentQ = test.testQuestions[currentIndex].question;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleTextAnswerChange = (text: string) => {
    if (!test) return;
    const currentQ = test.testQuestions[currentIndex].question;
    setTextAnswers((prev) => ({
      ...prev,
      [currentQ.id]: text,
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitTest();
  };

  const handleSubmitTest = async () => {
    if (!test || submitting) return;
    setSubmitting(true);

    const answersArray = test.testQuestions.map((tq) => ({
      questionId: tq.question.id,
      selectedAnswer: selectedAnswers[tq.question.id] ?? null,
      textAnswer: textAnswers[tq.question.id] || '',
    }));

    const timeTakenSecs = initialTime - timeLeftSeconds;

    try {
      const res = await fetch('/api/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          answers: answersArray,
          timeTaken: timeTakenSecs,
        }),
      });

      const data = await res.json();

      if (data.success && data.attemptId) {
        router.replace(`/analytics?attempt=${data.attemptId}&t=${Date.now()}`);
      } else {
        setError(data.error || 'Failed to submit test');
        setSubmitting(false);
      }
    } catch (err) {
      setError('Failed to submit test. Network error.');
      setSubmitting(false);
    }
  };

  const handleExitExam = () => {
    const shouldEnd = window.confirm('If you exit now, the exam will end and your current answers will be submitted.');
    if (shouldEnd) {
      handleSubmitTest();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400 gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-sky-400" />
          <span>Preparing Timed Mock Test Environment...</span>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md text-center space-y-4">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Error Loading Test</h2>
            <p className="text-xs text-slate-400">{error || 'Test not found'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold text-white"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questions = test.testQuestions.map((tq) => tq.question);
  const currentQ = questions[currentIndex];
  const isTimeCritical = timeLeftSeconds < 120;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h1 className="text-xl font-extrabold text-white">{test.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {test.subject.name} • {test.topic.name} • {questions.length} Questions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExitExam}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              Exit Exam
            </button>
            <div
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-mono text-lg font-bold transition-colors ${
                isTimeCritical
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : 'bg-slate-800 text-sky-400 border-slate-700'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Exit will end the exam and submit your current answers for analytics.</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                  currentIndex === idx
                    ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30'
                    : selectedAnswers[q.id] !== undefined || (textAnswers[q.id] && textAnswers[q.id].trim().length > 0)
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <QuestionCard
          question={currentQ}
          index={currentIndex}
          total={questions.length}
          selectedIndex={selectedAnswers[currentQ.id]}
          textAnswer={textAnswers[currentQ.id] || ''}
          onSelectOption={handleSelectOption}
          onChangeTextAnswer={handleTextAnswerChange}
          showResult={false}
          reviewMode={false}
        />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSubmitTest}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Evaluating Test & AI Descriptive Answers...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Exam</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
