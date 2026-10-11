'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface ScoreTrendPoint {
  date: string;
  score: number;
  testTitle?: string;
}

interface TopicPerformancePoint {
  topic: string;
  accuracy: number;
  subject?: string;
}

interface ScoreTrendChartProps {
  data: ScoreTrendPoint[];
}

interface TopicBarChartProps {
  data: TopicPerformancePoint[];
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No score trend data recorded yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.75rem',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value: any) => [`${value}%`, 'Score']}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={{ r: 5, fill: '#0284c7', stroke: '#38bdf8', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#38bdf8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopicPerformanceChart({ data }: TopicBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No topic performance data available yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis
            dataKey="topic"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.75rem',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value: any) => [`${value}%`, 'Accuracy']}
          />
          <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => {
              let fill = '#38bdf8'; // sky
              if (entry.accuracy < 60) fill = '#f87171'; // red
              else if (entry.accuracy <= 80) fill = '#fbbf24'; // amber
              else fill = '#34d399'; // emerald

              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
