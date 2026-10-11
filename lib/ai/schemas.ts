import { z } from 'zod';

export const QuestionTypeEnum = z.enum(['MCQ', 'SHORT_2_MARK', 'LONG_5_MARK', 'NAT']);

export const GeminiQuestionGenerationInputSchema = z.object({
  tier: z.string().default('SCHOOL'), // SCHOOL, COLLEGE, COMPETITIVE
  exam: z.string().default('CBSE'),
  classLevel: z.string().default('Class 10'),
  board: z.string().default('CBSE'),
  degreeMajor: z.string().optional(),
  syllabusType: z.string().default('STANDARD'), // STANDARD, UGC_MODEL, CUSTOM_UNIVERSITY, PYQ_OFFICIAL
  universityName: z.string().optional(),
  semester: z.number().optional(),
  generationMode: z.string().default('STANDARD'), // STANDARD, PYQ, FUTURE_PROBABLE
  examName: z.string().optional(), // GATE, NExT, CET, CAT
  targetYear: z.number().optional(),
  subjectName: z.string().min(1, 'Subject is required'),
  chapterName: z.string().default('General'),
  topicName: z.string().min(1, 'Topic is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  difficulty: z.string().default('Medium'),
  questionType: QuestionTypeEnum.default('MCQ'),
  numberOfQuestions: z.number().int().min(1).max(20).default(5),
  syllabusContext: z.string().optional(),
});

export const GeminiSingleQuestionSchema = z.object({
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

export const GeminiQuestionsResponseSchema = z.object({
  questions: z.array(GeminiSingleQuestionSchema).min(1),
});

export type GeminiQuestionGenerationInput = z.infer<typeof GeminiQuestionGenerationInputSchema>;
export type GeminiSingleQuestion = z.infer<typeof GeminiSingleQuestionSchema>;
