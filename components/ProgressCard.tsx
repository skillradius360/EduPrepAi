'use client';

import React from 'react';
import { BookOpen, Award, CheckCircle2, LineChart, Target, Users, Layers, HelpCircle, Sparkles, FileText } from 'lucide-react';

export type IconType =
  | 'book'
  | 'award'
  | 'check'
  | 'purple'
  | 'chart'
  | 'target'
  | 'users'
  | 'layers'
  | 'help'
  | 'sparkles'
  | 'file';

interface ProgressCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  iconName?: IconType;
  trend?: string;
  color?: 'sky' | 'emerald' | 'amber' | 'indigo' | 'purple';
}

const iconMap: Record<IconType, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  award: Award,
  check: CheckCircle2,
  purple: Award,
  chart: LineChart,
  target: Target,
  users: Users,
  layers: Layers,
  help: HelpCircle,
  sparkles: Sparkles,
  file: FileText,
};

export default function ProgressCard({
  title,
  value,
  subtitle,
  iconName = 'book',
  trend,
  color = 'sky',
}: ProgressCardProps) {
  const colorMap = {
    sky: 'from-sky-500/10 to-sky-500/5 border-sky-500/20 text-sky-400',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400',
    indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400',
  };

  const IconComponent = iconMap[iconName] || BookOpen;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorMap[color]} border shadow-sm`}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        {trend && (
          <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md mt-2 border border-emerald-500/20">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
