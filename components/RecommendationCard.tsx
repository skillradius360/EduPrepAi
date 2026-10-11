'use client';

import React from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { TopicRecommendation } from '@/app/api/recommendations/route';

interface RecommendationCardProps {
  item: TopicRecommendation;
}

export default function RecommendationCard({ item }: RecommendationCardProps) {
  const isWeak = item.status === 'WEAK';
  const isModerate = item.status === 'MODERATE';

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isWeak
          ? 'bg-red-950/20 border-red-500/30'
          : isModerate
          ? 'bg-amber-950/20 border-amber-500/30'
          : 'bg-emerald-950/20 border-emerald-500/30'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
              isWeak
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : isModerate
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isWeak ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isModerate ? (
              <Flame className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-white text-base">{item.topicName}</h4>
            <p className="text-xs text-slate-400">
              {item.subjectName} • {item.chapterName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Accuracy:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isWeak
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : isModerate
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {item.accuracy}% ({item.status})
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4 pl-1">
        {item.recommendationText}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Recommended Action
        </span>
        <Link
          href={`/practice?topicId=${item.topicId}`}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
            isWeak
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
              : isModerate
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
          }`}
        >
          <span>{item.suggestedAction}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
