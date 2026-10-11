import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import {
  GeminiQuestionGenerationInput,
  GeminiQuestionsResponseSchema,
  GeminiSingleQuestion,
} from './schemas';
import { EDUPREP_SYSTEM_INSTRUCTION, buildGeminiQuestionPrompt } from './prompts';

export interface GeminiQuestionGenerationResult {
  questions: GeminiSingleQuestion[];
  isFallback: boolean;
  message?: string;
}

/**
 * Central AI Service Layer for Google Gemini API
 * Exposes a clean abstraction generateQuestionsWithGemini(input)
 * Features auto-retry across active Gemini models (gemini-flash-lite-latest, gemini-2.5-flash, etc.)
 */
export async function generateQuestionsWithGemini(
  input: GeminiQuestionGenerationInput
): Promise<GeminiQuestionGenerationResult> {
  console.log(`[EduPrep AI] Starting dynamic question generation for topic: "${input.topicName}" (${input.subjectName})`);

  const apiKey = process.env.GEMINI_API_KEY;
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  const qType = input.questionType || 'MCQ';

  // 1. CHECK API KEY CONFIGURATION & USE ONLY APPROVED DATABASE QUESTIONS IF MISSING
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    console.warn('[EduPrep AI] GEMINI_API_KEY is missing or unconfigured. Using approved database questions only.');
    return await getFallbackQuestionsFromDatabase(
      input,
      'GEMINI_API_KEY is missing in .env. Showing approved question bank items only.'
    );
  }

  // 2. FETCH VERIFIED SYLLABUS CONTEXT FROM DATABASE
  let syllabusCtx = input.syllabusContext || '';
  if (!syllabusCtx) {
    const verifiedSource = await db.curriculumSource.findFirst({
      where: {
        subject: input.subjectName,
        status: 'VERIFIED',
      },
    });
    if (verifiedSource) {
      syllabusCtx = `Official Source Context (${verifiedSource.sourceName}): ${verifiedSource.content}`;
    }
  }

  const fullInput = { ...input, syllabusContext: syllabusCtx };
  const userPrompt = buildGeminiQuestionPrompt(fullInput);

  // Active Gemini models to attempt sequentially
  const candidateModels = Array.from(new Set([
    configuredModel,
    'gemini-flash-lite-latest',
    'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ]));

  let rawTextContent = '';
  let successfulModel = '';

  for (const modelName of candidateModels) {
    console.log(`[EduPrep AI] Attempting question generation with Gemini Model: "${modelName}"...`);
    
    // Primary Attempt: Use official @google/genai SDK
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: `${EDUPREP_SYSTEM_INSTRUCTION}\n\n${userPrompt}` }] },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.75,
        },
      });

      if (response.text && response.text.trim().length > 0) {
        rawTextContent = response.text;
        successfulModel = modelName;
        console.log(`[EduPrep AI] Successfully received response using Gemini Model "${modelName}".`);
        break;
      }
    } catch (sdkError: any) {
      console.warn(`[EduPrep AI] SDK call failed for model "${modelName}", trying direct REST endpoint:`, sdkError?.message || sdkError);
    }

    // Secondary Attempt: Direct REST endpoint for target model
    try {
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const restResponse = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${EDUPREP_SYSTEM_INSTRUCTION}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.75,
          },
        }),
      });

      if (restResponse.ok) {
        const restData = await restResponse.json();
        const text = restData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          rawTextContent = text;
          successfulModel = modelName;
          console.log(`[EduPrep AI] Successfully received REST response using Gemini Model "${modelName}".`);
          break;
        }
      } else {
        const errBody = await restResponse.text();
        console.warn(`[EduPrep AI] REST endpoint failed for model "${modelName}" (Status ${restResponse.status}):`, errBody);
      }
    } catch (restErr: any) {
      console.warn(`[EduPrep AI] REST call exception for model "${modelName}":`, restErr?.message || restErr);
    }
  }

  if (!rawTextContent || rawTextContent.trim() === '') {
    console.warn('[EduPrep AI] All Gemini candidate models were unavailable or returned empty responses.');
    return await getFallbackQuestionsFromDatabase(
      input,
      'Gemini API candidate models are currently unavailable. Showing dynamic questions from EduPrep question bank.'
    );
  }

  try {
    // Clean potential markdown code fences (```json ... ```)
    const cleanedJsonText = rawTextContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(cleanedJsonText);
    } catch (parseErr) {
      console.error('[EduPrep AI] Failed to parse JSON from Gemini response:', parseErr);
      return await getFallbackQuestionsFromDatabase(
        input,
        'Gemini returned unparseable output format. Showing dynamic questions from EduPrep question bank.'
      );
    }

    // Standardize & Normalize JSON shape before Zod validation
    let questionsList: any[] = [];
    if (Array.isArray(parsedJson)) {
      questionsList = parsedJson;
    } else if (parsedJson && Array.isArray(parsedJson.questions)) {
      questionsList = parsedJson.questions;
    } else if (parsedJson && Array.isArray(parsedJson.data)) {
      questionsList = parsedJson.data;
    }

    const normalizedQuestions = questionsList.map((q: any) => {
      const optionsArr = Array.isArray(q.options) ? q.options : [];
      let mappedCorrect = q.correctAnswer ?? q.answer;
      if (typeof mappedCorrect === 'string') {
        const parsedInt = parseInt(mappedCorrect, 10);
        if (!isNaN(parsedInt)) {
          mappedCorrect = parsedInt;
        } else {
          const upper = mappedCorrect.trim().toUpperCase();
          if (upper === 'A') mappedCorrect = 0;
          else if (upper === 'B') mappedCorrect = 1;
          else if (upper === 'C') mappedCorrect = 2;
          else if (upper === 'D') mappedCorrect = 3;
          else {
            // Find option string matching answer text
            const matchIndex = optionsArr.findIndex((opt: string) => opt.trim().toLowerCase() === mappedCorrect.trim().toLowerCase());
            if (matchIndex !== -1) mappedCorrect = matchIndex;
          }
        }
      }

      return {
        questionText: q.questionText || q.question || q.text || '',
        questionType: q.questionType || qType,
        optionA: q.optionA ?? optionsArr[0] ?? null,
        optionB: q.optionB ?? optionsArr[1] ?? null,
        optionC: q.optionC ?? optionsArr[2] ?? null,
        optionD: q.optionD ?? optionsArr[3] ?? null,
        correctAnswer: typeof mappedCorrect === 'number' ? mappedCorrect : 0,
        expectedAnswer: q.expectedAnswer ?? q.answer ?? null,
        markingScheme: q.markingScheme ?? null,
        explanation: q.explanation || `Detailed step-by-step educational explanation of ${input.topicName}.`,
        difficulty: q.difficulty || input.difficulty || 'Medium',
        marks: typeof q.marks === 'number' ? q.marks : qType === 'MCQ' ? 1 : qType === 'SHORT_2_MARK' ? 2 : qType === 'NAT' ? 2 : 5,
        examName: q.examName || input.examName || input.exam || null,
        paperYear: typeof q.paperYear === 'number' ? q.paperYear : input.targetYear || null,
        paperSession: q.paperSession || null,
        isProbableFuture: Boolean(q.isProbableFuture || input.generationMode === 'FUTURE_PROBABLE'),
        predictionRationale: q.predictionRationale || null,
      };
    });

    const validated = GeminiQuestionsResponseSchema.safeParse({ questions: normalizedQuestions });

    if (!validated.success) {
      console.error('[EduPrep AI] Zod Validation Error on Gemini Output:', validated.error.format());
      return await getFallbackQuestionsFromDatabase(
        input,
        'The generated response could not be validated. Showing dynamic questions from EduPrep question bank.'
      );
    }

    // 3. APPLICATION-LEVEL VALIDATION
    const validatedQuestions: GeminiSingleQuestion[] = [];
    for (const q of validated.data.questions) {
      if (qType === 'MCQ') {
        const hasOptions = q.optionA && q.optionB && q.optionC && q.optionD;
        const validCorrectIndex = typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3;
        if (!hasOptions || !validCorrectIndex) {
          console.warn('[EduPrep AI] Skipping invalid MCQ generated question:', q.questionText);
          continue;
        }
      }
      validatedQuestions.push({
        ...q,
        questionType: qType as any,
        difficulty: input.difficulty || q.difficulty || 'Medium',
      });
    }

    if (validatedQuestions.length === 0) {
      console.warn('[EduPrep AI] All generated questions failed application validation.');
      return await getFallbackQuestionsFromDatabase(
        input,
        'AI generated output failed application validation checks. Showing dynamic questions from EduPrep question bank.'
      );
    }

    console.log(`[EduPrep AI] Successfully generated and validated ${validatedQuestions.length} live AI questions using model "${successfulModel}".`);
    return {
      questions: validatedQuestions,
      isFallback: false,
    };
  } catch (error: any) {
    console.error('[EduPrep AI] Gemini API Exception:', error?.message || error);
    return await getFallbackQuestionsFromDatabase(
      input,
      'Unable to connect to the AI service. Showing dynamic questions from EduPrep question bank.'
    );
  }
}

/**
 * Fallback system: reuse only admin-approved database questions.
 * This never fabricates questions.
 */
async function getFallbackQuestionsFromDatabase(
  input: GeminiQuestionGenerationInput,
  fallbackMessage: string
): Promise<GeminiQuestionGenerationResult> {
  const qType = input.questionType || 'MCQ';

  // Fetch up to 50 APPROVED questions for this topic and shuffle them randomly
  const dbQuestions = await db.question.findMany({
    where: {
      topicId: input.topicId,
      status: 'APPROVED',
      questionType: qType,
    },
    take: 50,
  });

  if (dbQuestions.length > 0) {
    console.log(`[EduPrep AI] Retrieved ${dbQuestions.length} approved fallback questions from database. Shuffling...`);
    const shuffled = [...dbQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, input.numberOfQuestions);

    const mapped: GeminiSingleQuestion[] = selected.map((q) => ({
      questionText: q.questionText,
      questionType: (q.questionType as any) || 'MCQ',
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      expectedAnswer: q.expectedAnswer,
      markingScheme: q.markingScheme,
      explanation: q.explanation || 'Approved curriculum question.',
      difficulty: q.difficulty,
      marks: q.marks,
      isProbableFuture: Boolean((q as any).isProbableFuture),
      predictionRationale: (q as any).predictionRationale || null,
      examName: (q as any).examName || null,
      paperYear: (q as any).paperYear || null,
    }));

    return {
      questions: mapped,
      isFallback: true,
      message: fallbackMessage,
    };
  }

  throw new Error(`${fallbackMessage} No approved question bank items exist for ${input.topicName}. Add admin-approved questions or configure Gemini before generating.`);
}
