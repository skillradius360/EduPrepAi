'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ProgressCard from '@/components/ProgressCard';
import { ScoreTrendChart, TopicPerformanceChart } from '@/components/PerformanceChart';
import { LineChart, BarChart3, Award, CheckCircle2, Target, Sparkles, AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/analytics?t=${Date.now()}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Failed to load performance analytics');
        } else {
          setData(json);
        }
      } catch (err) {
        setError('Network error loading analytics data');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex">
        <Sidebar role="STUDENT" isOpen={isSidebarOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Header */}
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <LineChart className="w-6 h-6 text-emerald-400" />
              Performance Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Visual score trends and topic-wise accuracy metrics built with Recharts.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin text-sky-400" />
              <span>Analyzing student score trends and topic accuracies...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : !data?.hasData ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <Target className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Analytics Recorded Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No completed exam attempts were found for this user yet. Generate questions, submit the exam, or use Exit Exam to end it and record analytics.
              </p>
            </div>
          ) : (
            <>
              {/* Overall Statistics Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <ProgressCard
                  title="Average Score"
                  value={`${data.overallStats.averageScore}%`}
                  subtitle="Overall Mean Score"
                  iconName="award"
                  color="sky"
                />
                <ProgressCard
                  title="Best Score"
                  value={`${data.overallStats.bestScore}%`}
                  subtitle="Peak Performance"
                  iconName="award"
                  color="emerald"
                />
                <ProgressCard
                  title="Tests Attempted"
                  value={data.overallStats.testsAttempted}
                  subtitle="Mock Tests Given"
                  iconName="chart"
                  color="indigo"
                />
                <ProgressCard
                  title="Questions Practiced"
                  value={data.overallStats.totalQuestions}
                  subtitle="Total Answered"
                  iconName="check"
                  color="purple"
                />
                <ProgressCard
                  title="Accuracy"
                  value={`${data.overallStats.accuracy}%`}
                  subtitle="Correct Ratio"
                  iconName="target"
                  color="amber"
                />
              </div>

              {/* Recharts Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Score Trend Line Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-sky-400" />
                      <h2 className="text-base font-bold text-white">Historical Score Trend</h2>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">% Score over Tests</span>
                  </div>
                  <ScoreTrendChart data={data.scoreTrend} />
                </div>

                {/* Topic Performance Bar Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-base font-bold text-white">Topic Accuracy Breakdown</h2>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold">
                      <span className="text-red-400">Weak (&lt;60%)</span>
                      <span className="text-amber-400">Moderate (60-80%)</span>
                      <span className="text-emerald-400">Strong (&gt;80%)</span>
                    </div>
                  </div>
                  <TopicPerformanceChart data={data.topicPerformance} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
