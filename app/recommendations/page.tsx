'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import RecommendationCard from '@/components/RecommendationCard';
import { TopicRecommendation } from '@/app/api/recommendations/route';
import { Lightbulb, AlertTriangle, Sparkles, Target } from 'lucide-react';

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<TopicRecommendation[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicRecommendation[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const res = await fetch('/api/recommendations');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to fetch recommendations');
        } else {
          setRecommendations(data.recommendations || []);
          setWeakTopics(data.weakTopics || []);
          if (data.message) setMessage(data.message);
        }
      } catch (err) {
        setError('Network error fetching recommendations');
      } finally {
        setLoading(false);
      }
    }
    loadRecommendations();
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
          {/* Header */}
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Lightbulb className="w-6 h-6 text-amber-400" />
              Personalized Learning Recommendations
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Rule-based feedback and study advice calculated from your topic accuracy levels.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin text-sky-400" />
              <span>Analyzing weak topics and compiling study recommendations...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <Target className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Test Data Available</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {message || 'Complete at least one practice test to unlock your customized study recommendations.'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Weak Topics Highlight Banner */}
              {weakTopics.length > 0 && (
                <div className="p-5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Immediate Action Needed ({weakTopics.length} Weak Topics)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    The following topics fall below the 60% accuracy threshold and require focused revision before taking full mock exams.
                  </p>
                </div>
              )}

              {/* Recommendations List */}
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <RecommendationCard key={rec.topicId} item={rec} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
