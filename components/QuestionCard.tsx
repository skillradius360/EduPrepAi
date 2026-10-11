'use client';

import React from 'react';
import { CheckCircle2, XCircle, Sparkles, FileText, Award } from 'lucide-react';

export interface QuestionData {
  id?: string;
  questionText: string;
  questionType?: 'MCQ' | 'SHORT_2_MARK' | 'LONG_5_MARK' | 'NAT';
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer?: number | null; // 0, 1, 2, 3
  expectedAnswer?: string | null;
  markingScheme?: string | null;
  explanation?: string | null;
  difficulty?: string;
  marks?: number;
  examName?: string | null;
  paperYear?: number | null;
  paperSession?: string | null;
  isProbableFuture?: boolean;
  predictionRationale?: string | null;
}

interface QuestionCardProps {
  question: QuestionData;
  index: number;
  total: number;
  selectedIndex?: number | null;
  textAnswer?: string;
  onSelectOption?: (optionIndex: number) => void;
  onChangeTextAnswer?: (text: string) => void;
  showResult?: boolean;
  reviewMode?: boolean;
  awardedMarks?: number;
  feedback?: string;
}

export default function QuestionCard({
  question,
  index,
  total,
  selectedIndex,
  textAnswer = '',
  onSelectOption,
  onChangeTextAnswer,
  showResult = false,
  reviewMode = false,
  awardedMarks,
  feedback,
}: QuestionCardProps) {
  const qType = question.questionType || 'MCQ';
  const qMarks = question.marks || (qType === 'MCQ' ? 1 : qType === 'SHORT_2_MARK' ? 2 : qType === 'NAT' ? 2 : 5);

  const options = [
    question.optionA || '',
    question.optionB || '',
    question.optionC || '',
    question.optionD || '',
  ];
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-sm flex items-center justify-center">
            {index + 1}
          </span>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Question {index + 1} of {total}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-bold text-indigo-400">
                {qType === 'MCQ'
                  ? 'Multiple Choice (1 Mark)'
                  : qType === 'SHORT_2_MARK'
                  ? 'Short Answer (2 Marks)'
                  : qType === 'NAT'
                  ? 'Numerical Answer Type (2 Marks)'
                  : 'Descriptive Question (5 Marks)'}
              </span>

              {question.isProbableFuture && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  🔮 Future Probable
                </span>
              )}

              {question.paperYear && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  📄 {question.examName || 'PYQ'} {question.paperYear}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {qMarks} {qMarks === 1 ? 'Mark' : 'Marks'}
          </span>
          {question.difficulty && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                question.difficulty === 'Easy'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : question.difficulty === 'Hard'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {question.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <h3 className="text-lg font-semibold text-white leading-relaxed">
        {question.questionText}
      </h3>

      {/* TYPE 1: MCQ OPTIONS */}
      {qType === 'MCQ' && (
        <div className="space-y-3">
          {options.map((option, optIdx) => {
            const isSelected = selectedIndex === optIdx;
            const isCorrect = question.correctAnswer === optIdx;

            let cardStyle =
              'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:border-slate-600 hover:bg-slate-800';

            if (reviewMode || showResult) {
              if (isCorrect) {
                cardStyle = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-medium';
              } else if (isSelected && !isCorrect) {
                cardStyle = 'bg-red-950/40 border-red-500/50 text-red-200';
              } else {
                cardStyle = 'bg-slate-800/30 border-slate-800 text-slate-400 opacity-70';
              }
            } else if (isSelected) {
              cardStyle = 'bg-sky-500/15 border-sky-500 text-white font-medium ring-1 ring-sky-500/30';
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={reviewMode || showResult}
                onClick={() => onSelectOption && onSelectOption(optIdx)}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${cardStyle}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5 border ${
                    reviewMode || showResult
                      ? isCorrect
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : isSelected
                        ? 'bg-red-500 text-white border-red-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                      : isSelected
                      ? 'bg-sky-500 text-white border-sky-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {optionLabels[optIdx]}
                </div>
                <div className="flex-1 text-sm leading-relaxed">{option}</div>
                {(reviewMode || showResult) && (
                  <div>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                    {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* TYPE 2, 3 & 4: SHORT / LONG / NAT ANSWER INPUT */}
      {(qType === 'SHORT_2_MARK' || qType === 'LONG_5_MARK' || qType === 'NAT') && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            {qType === 'NAT' ? 'Numerical Answer (NAT):' : 'Your Written Response:'}
          </label>

          {!reviewMode && !showResult ? (
            qType === 'NAT' ? (
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => onChangeTextAnswer && onChangeTextAnswer(e.target.value)}
                placeholder="Enter exact numerical value (e.g. 4.25 or 12)..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <textarea
                rows={qType === 'LONG_5_MARK' ? 6 : 3}
                value={textAnswer}
                onChange={(e) => onChangeTextAnswer && onChangeTextAnswer(e.target.value)}
                placeholder={
                  qType === 'SHORT_2_MARK'
                    ? 'Type your short explanation, definition, or formula response here...'
                    : 'Type your detailed step-by-step descriptive answer, key points, and derivation here...'
                }
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
              />
            )
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {textAnswer || <span className="italic text-slate-500">No answer submitted.</span>}
            </div>
          )}
        </div>
      )}

      {/* Review Mode AI Descriptive Feedback, Model Answer & Prediction Rationale */}
      {(reviewMode || showResult) && (
        <div className="space-y-3 pt-2">
          {/* Prediction Rationale for Future Probable questions */}
          {question.predictionRationale && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <span className="font-extrabold uppercase tracking-wider block text-amber-300">
                🔮 Trend & Prediction Rationale
              </span>
              <p className="leading-relaxed opacity-95">{question.predictionRationale}</p>
            </div>
          )}
          {/* AI Evaluator Feedback Box for Descriptive Answers */}
          {qType !== 'MCQ' && awardedMarks !== undefined && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>AI Evaluator Assessment</span>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                  Awarded: {awardedMarks} / {qMarks} Marks
                </span>
              </div>
              {feedback && <p className="text-xs text-slate-300 leading-relaxed">{feedback}</p>}
            </div>
          )}

          {/* Model Answer & Marking Scheme */}
          {question.expectedAnswer && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Model Expected Answer
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{question.expectedAnswer}</p>
              {question.markingScheme && (
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-900 mt-2">
                  <strong className="text-slate-400">Marking Scheme:</strong> {question.markingScheme}
                </p>
              )}
            </div>
          )}

          {/* Educational Explanation */}
          {question.explanation && (
            <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Educational Explanation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
