'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import QuestionCard from '@/components/QuestionCard';
import { Award, CheckCircle2, XCircle, Clock, Lightbulb, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';

interface AttemptDetail {
  id: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number; // seconds
  createdAt: string;
  test: {
    title: string;
    subject: { name: string };
    topic: { name: string };
  };
  answers: {
    id: string;
    selectedAnswer?: number | null;
    textAnswer?: string | null;
    awardedMarks: number;
    maxMarks: number;
    isCorrect: boolean;
    evaluationType: string;
    feedback?: string | null;
    question: {
      id: string;
      questionText: string;
      questionType: 'MCQ' | 'SHORT_2_MARK' | 'LONG_5_MARK';
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
    };
  }[];
}

export default function ResultPage({ params }: { params: { attemptId: string } }) {
  const attemptId = params.attemptId;

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAttempt() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}`);
        const data = await res.json();

        if (!res.ok || !data.attempt) {
          setError(data.error || 'Failed to fetch test results');
          setLoading(false);
          return;
        }

        setAttempt(data.attempt);
      } catch (err) {
        setError('Connection error loading attempt.');
      } finally {
        setLoading(false);
      }
    }
    loadAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400 gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-sky-400" />
          <span>Calculating Test Performance & AI Descriptive Evaluation...</span>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md text-center space-y-4">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Results Not Found</h2>
            <p className="text-xs text-slate-400">{error}</p>
            <Link href="/dashboard" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold text-white inline-block">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const incorrectAnswers = attempt.totalQuestions - attempt.correctAnswers;
  const timeTakenFormatted = `${Math.floor(attempt.timeTaken / 60)} min ${attempt.timeTaken % 60} sec`;
  const displayPercentage = attempt.percentage || Math.round((attempt.score / (attempt.totalMarks || 1)) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-white">Test Completed!</h1>
            <p className="text-xs text-slate-400 mt-1">
              {attempt.test.title} • {attempt.test.subject.name} • {attempt.test.topic.name}
            </p>
          </div>

          <div className="inline-block px-8 py-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Final Score Marks</span>
            <div className="flex items-baseline justify-center gap-2 mt-1">
              <span
                className={`text-4xl sm:text-5xl font-black tracking-tight ${
                  displayPercentage >= 80
                    ? 'text-emerald-400'
                    : displayPercentage >= 60
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {attempt.score} / {attempt.totalMarks}
              </span>
              <span className="text-sm font-bold text-slate-400">({displayPercentage}%)</span>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Link
              href="/recommendations"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
            >
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>Practice Weak Topics & Recommendations</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Questions</span>
            <p className="text-2xl font-bold text-white mt-1">{attempt.totalQuestions}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Correct / Passed</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{attempt.correctAnswers}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-red-400 font-semibold uppercase tracking-wider">Needs Review</span>
            <p className="text-2xl font-bold text-red-400 mt-1">{incorrectAnswers}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">Time Taken</span>
            <p className="text-2xl font-bold text-sky-400 mt-1">{timeTakenFormatted}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white">Detailed Question & AI Evaluation Review</h2>
            <p className="text-xs text-slate-400">Review your objective MCQs and AI-assisted descriptive evaluations.</p>
          </div>

          <div className="space-y-6">
            {attempt.answers.map((ans, idx) => (
              <QuestionCard
                key={ans.id}
                question={ans.question}
                index={idx}
                total={attempt.answers.length}
                selectedIndex={ans.selectedAnswer ?? undefined}
                textAnswer={ans.textAnswer || ''}
                showResult={true}
                reviewMode={true}
                awardedMarks={ans.awardedMarks}
                feedback={ans.feedback || undefined}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
