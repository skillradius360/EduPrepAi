import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ProgressCard from '@/components/ProgressCard';
import TopicSelectorClient from './TopicSelectorClient';
import DashboardClientShell from './DashboardClientShell';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BookOpen, Award, CheckCircle2, AlertTriangle, ArrowRight, Clock } from 'lucide-react';

export const revalidate = 0;

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if ((user.role || '').toUpperCase() === 'ADMIN') {
    redirect('/admin');
  }

  // Fetch student statistics & recent attempts
  const attempts = await db.attempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      test: {
        include: {
          subject: true,
          topic: true,
        },
      },
    },
  });

  const totalTests = attempts.length;
  const avgScore =
    totalTests > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalTests)
      : 0;

  const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);

  // Group by topic to calculate weak topics (<60%) and strong topics (>80%)
  const topicStats: Record<string, { topicName: string; subjectName: string; percentages: number[] }> = {};

  attempts.forEach((a) => {
    const tName = a.test.topic.name;
    const sName = a.test.subject.name;
    if (!topicStats[tName]) {
      topicStats[tName] = { topicName: tName, subjectName: sName, percentages: [] };
    }
    topicStats[tName].percentages.push(a.percentage);
  });

  const weakTopicsList: { topicName: string; subjectName: string; accuracy: number }[] = [];
  let strongTopicsCount = 0;

  Object.values(topicStats).forEach((item) => {
    const accuracy = Math.round(item.percentages.reduce((sum, s) => sum + s, 0) / item.percentages.length);
    if (accuracy < 60) {
      weakTopicsList.push({
        topicName: item.topicName,
        subjectName: item.subjectName,
        accuracy,
      });
    } else if (accuracy > 80) {
      strongTopicsCount += 1;
    }
  });

  return (
    <DashboardClientShell user={user}>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 w-full">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                {user.institutionType === 'COLLEGE'
                  ? `${user.degreeMajor || 'Undergraduate'} • ${user.semester ? `Semester ${user.semester}` : 'College'} • ${user.universityName || user.board || 'University'}`
                  : user.institutionType === 'COMPETITIVE'
                  ? `Competitive Entrance • ${user.board || 'National'}`
                  : `${user.class || 'Class 10'} • ${user.board || 'CBSE'}`}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">{user.name}</span>!
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2 leading-relaxed">
                Ready to practice? Your personalized curriculum for your track is ready below to generate AI practice questions.
              </p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <ProgressCard
              title="Tests Attempted"
              value={totalTests}
              subtitle="Completed Mock Tests"
              iconName="book"
              color="sky"
            />
            <ProgressCard
              title="Average Score"
              value={`${avgScore}%`}
              subtitle="Overall Accuracy"
              iconName="award"
              color="indigo"
            />
            <ProgressCard
              title="Questions Practiced"
              value={totalQuestions}
              subtitle="Questions Answered"
              iconName="check"
              color="emerald"
            />
            <ProgressCard
              title="Strong Topics"
              value={strongTopicsCount}
              subtitle="Accuracy > 80%"
              iconName="purple"
              color="purple"
            />
          </div>

          {/* Quick Practice Generator */}
          <div className="space-y-4">
            <TopicSelectorClient />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Tests Table (2 cols) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-400" />
                  <h2 className="text-lg font-bold text-white">Recent Test Attempts</h2>
                </div>
                <Link href="/analytics" className="text-xs font-semibold text-sky-400 hover:underline">
                  View Full History
                </Link>
              </div>

              {attempts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm space-y-2">
                  <p>No tests attempted yet.</p>
                  <p className="text-xs text-slate-600">Select a topic above to generate your first test set!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {attempts.slice(0, 5).map((att) => (
                    <div key={att.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-white text-sm">{att.test.title}</h4>
                        <p className="text-xs text-slate-400">
                          {att.test.subject.name} • {att.test.topic.name} •{' '}
                          {new Date(att.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm font-extrabold px-3 py-1 rounded-full border ${
                            att.percentage >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : att.percentage >= 60
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {Math.round(att.percentage)}%
                        </span>
                        <Link
                          href={`/results/${att.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                        >
                          View Result
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weak Topics Card (1 col) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">Weak Topics Needing Attention</h2>
                </div>

                {weakTopicsList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                    <p className="font-semibold text-emerald-400">Great Job!</p>
                    <p>No topics currently falling below 60% accuracy threshold.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weakTopicsList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white text-xs">{item.topicName}</p>
                          <p className="text-[11px] text-slate-400">{item.subjectName}</p>
                        </div>
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-md border border-red-500/20">
                          {item.accuracy}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <Link
                  href="/recommendations"
                  className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>View Recommendations</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </main>
    </DashboardClientShell>
  );
}
