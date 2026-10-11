import { z } from 'zod';

export const QuestionTypeEnum = z.enum(['MCQ', 'SHORT_2_MARK', 'LONG_5_MARK', 'NAT']);
export const TierEnum = z.enum(['SCHOOL', 'COLLEGE', 'COMPETITIVE']).default('SCHOOL');
export const SyllabusTypeEnum = z.enum(['STANDARD', 'UGC_MODEL', 'CUSTOM_UNIVERSITY', 'PYQ_OFFICIAL']).default('STANDARD');
export const GenerationModeEnum = z.enum(['STANDARD', 'PYQ', 'FUTURE_PROBABLE']).default('STANDARD');

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institutionType: z.enum(['SCHOOL', 'COLLEGE', 'COMPETITIVE']).default('SCHOOL'),
  class: z.string().optional(),
  board: z.string().optional(),
  degreeMajor: z.string().optional(),
  universityName: z.string().optional(),
  semester: z.coerce.number().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const GenerateQuestionsSchema = z.object({
  tier: z.string().default('SCHOOL'), // SCHOOL, COLLEGE, COMPETITIVE
  exam: z.string().default('CBSE'),
  classLevel: z.string().default('Class 10'),
  board: z.string().default('CBSE'),
  degreeMajor: z.string().optional(),
  syllabusType: z.string().default('STANDARD'),
  universityName: z.string().optional(),
  semester: z.coerce.number().optional(),
  generationMode: z.string().default('STANDARD'), // STANDARD, PYQ, FUTURE_PROBABLE
  examName: z.string().optional(), // GATE, NExT, CET, CAT
  targetYear: z.coerce.number().optional(), // For PYQ extraction e.g. 2023, 2024
  subjectId: z.string().optional(),
  chapterId: z.string().optional(),
  topicId: z.string().min(1, 'Topic selection is required'),
  subject: z.string().optional(),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.string().default('Medium'),
  questionType: QuestionTypeEnum.default('MCQ'),
  count: z.coerce.number().min(1).max(50).default(5),
  numberOfQuestions: z.coerce.number().min(1).max(50).optional(),
  syllabusContext: z.string().optional(),
});

export const SubmitTestSchema = z.object({
  testId: z.string().min(1, 'Test ID is required'),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswer: z.number().min(0).max(3).nullable().optional(),
      textAnswer: z.string().optional(),
    })
  ),
  timeTaken: z.number().min(0),
});

export const CurriculumSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  class: z.string().default('Class 10'),
  board: z.string().default('CBSE'),
});

export const CurriculumChapterSchema = z.object({
  name: z.string().min(2, 'Chapter name is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
});

export const CurriculumTopicSchema = z.object({
  name: z.string().min(2, 'Topic name is required'),
  chapterId: z.string().min(1, 'Chapter ID is required'),
});

// Admin Manual Question Creation Schema
export const ManualQuestionSchema = z.object({
  topicId: z.string().min(1, 'Topic selection is required'),
  questionType: QuestionTypeEnum,
  questionText: z.string().min(5, 'Question text must be at least 5 characters'),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctAnswer: z.number().min(0).max(3).optional(),
  expectedAnswer: z.string().optional(),
  markingScheme: z.string().optional(),
  explanation: z.string().min(3, 'Explanation is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'easy', 'medium', 'hard']).default('Medium'),
  marks: z.number().min(1).max(10).default(1),
  examName: z.string().optional(),
  paperYear: z.number().optional(),
  paperSession: z.string().optional(),
  isProbableFuture: z.boolean().default(false),
  predictionRationale: z.string().optional(),
});

// AI Question Output Schema
export const SingleQuestionSchema = z.object({
  questionText: z.string().min(5),
  questionType: QuestionTypeEnum.default('MCQ'),
  optionA: z.string().nullable().optional(),
  optionB: z.string().nullable().optional(),
  optionC: z.string().nullable().optional(),
  optionD: z.string().nullable().optional(),
  correctAnswer: z.number().int().min(0).max(3).nullable().optional(),
  expectedAnswer: z.string().nullable().optional(),
  markingScheme: z.string().nullable().optional(),
  explanation: z.string().min(3),
  difficulty: z.string().default('Medium'),
  marks: z.number().default(1),
  examName: z.string().nullable().optional(),
  paperYear: z.number().nullable().optional(),
  paperSession: z.string().nullable().optional(),
  isProbableFuture: z.boolean().default(false),
  predictionRationale: z.string().nullable().optional(),
});

export const AiQuestionResponseSchema = z.object({
  questions: z.array(SingleQuestionSchema).min(1),
});

// AI Descriptive Answer Evaluation Schema (2-mark and 5-mark answers)
export const DescriptiveEvaluationSchema = z.object({
  awardedMarks: z.number().min(0),
  feedback: z.string().min(5),
  matchedConcepts: z.array(z.string()).default([]),
  missingConcepts: z.array(z.string()).default([]),
  confidence: z.number().default(0.9),
});

// Camera Question Extraction Output Schema
export const ExtractedQuestionsSchema = z.object({
  rawText: z.string().optional(),
  questions: z.array(
    z.object({
      questionText: z.string().min(3),
      questionType: QuestionTypeEnum.default('MCQ'),
      optionA: z.string().optional(),
      optionB: z.string().optional(),
      optionC: z.string().optional(),
      optionD: z.string().optional(),
      correctAnswer: z.number().optional(),
      expectedAnswer: z.string().optional(),
      markingScheme: z.string().optional(),
      explanation: z.string().optional(),
      marks: z.number().default(1),
      difficulty: z.string().default('Medium'),
    })
  ).min(1),
});

// Syllabus Research Request Schema
export const SyllabusResearchSchema = z.object({
  board: z.string().default('CBSE'),
  className: z.string().default('Class 10'),
  subject: z.string().optional(),
  query: z.string().optional(),
  chapters: z.string().optional(),
  tier: TierEnum.default('SCHOOL'),
  degreeMajor: z.string().optional(),
  syllabusType: SyllabusTypeEnum.default('STANDARD'),
  universityName: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsSchema>;
export type SubmitTestInput = z.infer<typeof SubmitTestSchema>;
export type SingleQuestionType = z.infer<typeof SingleQuestionSchema>;
export type DescriptiveEvaluationType = z.infer<typeof DescriptiveEvaluationSchema>;
export type ManualQuestionInput = z.infer<typeof ManualQuestionSchema>;
