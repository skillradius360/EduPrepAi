'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopicSelector from '@/components/TopicSelector';

export default function TopicSelectorClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (selection: {
    tier?: string;
    exam?: string;
    classLevel?: string;
    board?: string;
    degreeMajor?: string;
    syllabusType?: string;
    universityName?: string;
    semester?: number;
    generationMode?: string;
    examName?: string;
    targetYear?: number;
    subjectId: string;
    chapterId: string;
    topicId: string;
    difficulty: string;
    questionType?: string;
    count: number;
  }) => {
    setLoading(true);
    const params: Record<string, string> = {
      subjectId: selection.subjectId,
      chapterId: selection.chapterId,
      topicId: selection.topicId,
      difficulty: selection.difficulty,
      questionType: selection.questionType || 'MCQ',
      count: String(selection.count),
      autoStart: 'true',
    };

    if (selection.tier) params.tier = selection.tier;
    if (selection.exam) params.exam = selection.exam;
    if (selection.classLevel) params.classLevel = selection.classLevel;
    if (selection.board) params.board = selection.board;
    if (selection.degreeMajor) params.degreeMajor = selection.degreeMajor;
    if (selection.syllabusType) params.syllabusType = selection.syllabusType;
    if (selection.universityName) params.universityName = selection.universityName;
    if (selection.semester) params.semester = String(selection.semester);
    if (selection.generationMode) params.generationMode = selection.generationMode;
    if (selection.examName) params.examName = selection.examName;
    if (selection.targetYear) params.targetYear = String(selection.targetYear);

    const query = new URLSearchParams(params);
    router.push(`/practice?${query.toString()}`);
  };

  return <TopicSelector onGenerate={handleGenerate} loading={loading} />;
}
