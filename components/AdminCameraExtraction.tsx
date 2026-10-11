'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Camera, Upload, Sparkles, CheckCircle2, RefreshCw, AlertCircle, Edit3, Trash2 } from 'lucide-react';

interface ExtractedItem {
  questionText: string;
  questionType: 'MCQ' | 'SHORT_2_MARK' | 'LONG_5_MARK';
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: number;
  expectedAnswer?: string;
  markingScheme?: string;
  explanation?: string;
  difficulty?: string;
  marks?: number;
}

interface SubjectItem {
  id: string;
  name: string;
  chapters: {
    id: string;
    name: string;
    topics: {
      id: string;
      name: string;
    }[];
  }[];
}

export default function AdminCameraExtraction({ onApproved }: { onApproved?: () => void }) {
  const [mode, setMode] = useState<'CAMERA' | 'UPLOAD'>('CAMERA');
  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');

  const [extracting, setExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedItem[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const res = await fetch('/api/curriculum');
        const data = await res.json();
        if (data.subjects?.length) {
          setSubjects(data.subjects);
          setSelectedSubjectId(data.subjects[0].id);
        }
      } catch (err) {
        console.error('Failed to load curriculum for extraction:', err);
      }
    }

    loadCurriculum();
  }, []);

  const activeSubject = subjects.find((subject) => subject.id === selectedSubjectId);
  const activeChapters = activeSubject?.chapters || [];
  const activeChapter = activeChapters.find((chapter) => chapter.id === selectedChapterId);
  const activeTopics = activeChapter?.topics || [];

  useEffect(() => {
    setSelectedChapterId(activeChapters[0]?.id || '');
  }, [selectedSubjectId]);

  useEffect(() => {
    setSelectedTopicId(activeTopics[0]?.id || '');
  }, [selectedChapterId]);

  // Start browser camera stream
  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch (err) {
      setError('Camera access denied or unavailable. Please use image file upload below.');
      setStreaming(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  // Capture frame from video
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      setRawText('');
      stopCamera();
    }
  };

  // Handle file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        setRawText('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger AI Question Extraction
  const handleExtract = async () => {
    if (!selectedTopicId) {
      setError('Select the syllabus subject, chapter, and topic before extraction.');
      return;
    }

    if (!rawText.trim()) {
      setError('Paste the extracted/OCR text from the image before running AI structuring.');
      return;
    }

    setExtracting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/questions/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          topicId: selectedTopicId,
          context: {
            subjectName: activeSubject?.name,
            chapterName: activeChapter?.name,
            topicName: activeTopics.find((topic) => topic.id === selectedTopicId)?.name,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Extraction failed');
        setExtracting(false);
        return;
      }

      setExtractedQuestions(data.extractedQuestions || []);
      setIsFallback(data.isFallback || false);
    } catch (err) {
      setError('Connection error extracting questions');
    } finally {
      setExtracting(false);
    }
  };

  // Approve Extracted Question
  const handleApproveExtracted = async (item: ExtractedItem, index: number) => {
    if (!selectedTopicId) {
      setError('Select a syllabus topic before saving extracted questions.');
      return;
    }

    try {
      const res = await fetch('/api/questions/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicId,
          questionType: item.questionType,
          questionText: item.questionText,
          optionA: item.optionA,
          optionB: item.optionB,
          optionC: item.optionC,
          optionD: item.optionD,
          correctAnswer: item.correctAnswer || 0,
          expectedAnswer: item.expectedAnswer,
          markingScheme: item.markingScheme,
          explanation: item.explanation || 'Extracted camera question approved by admin.',
          difficulty: item.difficulty || 'Medium',
          marks: item.marks || (item.questionType === 'MCQ' ? 1 : item.questionType === 'SHORT_2_MARK' ? 2 : 5),
        }),
      });

      if (res.ok) {
        setMessage(`✅ Extracted Question #${index + 1} approved and saved to Question Bank!`);
        setExtractedQuestions((prev) => prev.filter((_, i) => i !== index));
        if (onApproved) onApproved();
      }
    } catch (err) {
      setError('Failed to approve question');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            Camera & Image Question Extraction Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture textbook photos or upload worksheets to extract and structure questions with AI.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('CAMERA');
              startCamera();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'CAMERA' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Webcam Capture
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('UPLOAD');
              stopCamera();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'UPLOAD' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Upload Image
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Chapter
          </label>
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
          >
            {activeChapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Topic
          </label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
          >
            {activeTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode 1: Camera Live Capture */}
      {mode === 'CAMERA' && (
        <div className="space-y-4 text-center">
          {!capturedImage ? (
            <div className="relative max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden min-h-[240px] flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {!streaming && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                  Enable Webcam Stream
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-2">
              <img src={capturedImage} alt="Captured preview" className="w-full rounded-2xl border border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake Photo
              </button>
            </div>
          )}

          {streaming && !capturedImage && (
            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Snap Photo
            </button>
          )}
        </div>
      )}

      {/* Mode 2: File Upload */}
      {mode === 'UPLOAD' && (
        <div className="p-8 bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-3">
          <Upload className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Upload Worksheet or Textbook Image</h3>
          <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP images containing printed or written questions.</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="camera-upload-input"
          />
          <label
            htmlFor="camera-upload-input"
            className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Select Image File
          </label>
        </div>
      )}

      {(capturedImage || mode === 'UPLOAD') && (
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Extracted / OCR Text
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={5}
            placeholder="Paste OCR text from the captured image or worksheet here. The AI will structure it and compare it with the selected syllabus topic."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white resize-y"
          />
        </div>
      )}

      {/* Extract Button */}
      {(capturedImage || rawText.trim()) && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {extracting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                <span>AI Structuring Extracted Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Extract & Structure Questions with Groq AI</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Extracted Questions Review & Approval Queue */}
      {extractedQuestions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-sky-400" />
              Editable Preview ({extractedQuestions.length} Questions Extracted)
            </h3>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
              Default Status: PENDING
            </span>
          </div>

          <div className="space-y-4">
            {extractedQuestions.map((q, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400">
                    Question #{idx + 1} ({q.questionType}) — {q.marks || (q.questionType === 'MCQ' ? 1 : q.questionType === 'SHORT_2_MARK' ? 2 : 5)} Marks
                  </span>
                  <button
                    type="button"
                    onClick={() => setExtractedQuestions((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-400 text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={q.questionText}
                  onChange={(e) => {
                    const updated = [...extractedQuestions];
                    updated[idx].questionText = e.target.value;
                    setExtractedQuestions(updated);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-medium"
                />

                {q.questionType !== 'MCQ' && (
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                      Expected Model Answer
                    </label>
                    <textarea
                      rows={2}
                      value={q.expectedAnswer || ''}
                      onChange={(e) => {
                        const updated = [...extractedQuestions];
                        updated[idx].expectedAnswer = e.target.value;
                        setExtractedQuestions(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => handleApproveExtracted(q, idx)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Save to Question Bank
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
