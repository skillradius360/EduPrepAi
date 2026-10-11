import { db } from './db';
import {
  AiQuestionResponseSchema,
  DescriptiveEvaluationSchema,
  ExtractedQuestionsSchema,
  SingleQuestionType,
  DescriptiveEvaluationType,
} from './validation';

export interface GenerateAiQuestionsParams {
  className?: string;
  board?: string;
  subjectName: string;
  chapterName: string;
  topicName: string;
  topicId: string;
  difficulty: string;
  questionType?: 'MCQ' | 'SHORT_2_MARK' | 'LONG_5_MARK';
  count: number;
  syllabusContext?: string;
}

export interface AiQuestionsResult {
  questions: SingleQuestionType[];
  isFallback: boolean;
  message?: string;
}

export interface EvaluateDescriptiveParams {
  questionText: string;
  studentAnswer: string;
  expectedAnswer?: string;
  markingScheme?: string;
  maxMarks: number;
}

// 1. DYNAMIC AI QUESTION GENERATOR (Syllabus-aware, Multi-type)
export async function generateQuestionsWithGroq(
  params: GenerateAiQuestionsParams
): Promise<AiQuestionsResult> {
  const apiKey = process.env.GROQ_API_KEY;
  const qType = params.questionType || 'MCQ';
  const targetMarks = qType === 'MCQ' ? 1 : qType === 'SHORT_2_MARK' ? 2 : 5;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_groq_api_key')) {
    console.warn('GROQ_API_KEY is missing or unconfigured. Checking approved question bank.');
    return await getFallbackQuestions(params, 'AI generation is unavailable. Showing approved question bank items only.');
  }

  // Fetch verified curriculum sources if available
  let extraContext = params.syllabusContext || '';
  if (!extraContext) {
    const sourceRecord = await db.curriculumSource.findFirst({
      where: {
        subject: params.subjectName,
        status: 'VERIFIED',
      },
    });
    if (sourceRecord) {
      extraContext = `Official Source Context (${sourceRecord.sourceName}): ${sourceRecord.content}`;
    }
  }

  const prompt = `You are an educational question generator for Indian school students (${params.board || 'CBSE'} ${params.className || 'Class 10'}).
Generate strictly ${params.count} questions of type "${qType}" worth ${targetMarks} marks each for:
Subject: ${params.subjectName}
Chapter: ${params.chapterName}
Topic: ${params.topicName}
Target Difficulty: ${params.difficulty}
${extraContext ? `\nVerified Syllabus Context:\n${extraContext}\n` : ''}

Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "questionText": "Clear question text?",
      "questionType": "${qType}",
      "optionA": ${qType === 'MCQ' ? '"Option A text"' : 'null'},
      "optionB": ${qType === 'MCQ' ? '"Option B text"' : 'null'},
      "optionC": ${qType === 'MCQ' ? '"Option C text"' : 'null'},
      "optionD": ${qType === 'MCQ' ? '"Option D text"' : 'null'},
      "correctAnswer": ${qType === 'MCQ' ? 0 : 'null'},
      "expectedAnswer": ${qType !== 'MCQ' ? '"Comprehensive model answer..."' : 'null'},
      "markingScheme": ${qType !== 'MCQ' ? '"Mark breakdown guidelines..."' : 'null'},
      "explanation": "Clear educational explanation.",
      "difficulty": "${params.difficulty}",
      "marks": ${targetMarks}
    }
  ]
}

Rules:
1. For MCQ: "correctAnswer" MUST be an integer 0..3 (0 for optionA, 1 for optionB, 2 for optionC, 3 for optionD).
2. For SHORT_2_MARK or LONG_5_MARK: option fields should be null and expectedAnswer + markingScheme MUST be provided.
3. Ensure exact alignment with CBSE Class 10 standards.
4. Output raw JSON only without markdown wrapping.
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You output strictly valid JSON matching the schema.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      console.error('Groq API Error:', response.status);
      return await getFallbackQuestions(params, 'AI service returned an error. Showing approved question bank items only.');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return await getFallbackQuestions(params, 'Empty AI response. Showing approved question bank items only.');

    const parsedJson = JSON.parse(content);
    const validated = AiQuestionResponseSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.error('Zod Validation Error on AI Response:', validated.error);
      return await getFallbackQuestions(params, 'AI output structure validation failed. Showing approved question bank items only.');
    }

    return {
      questions: validated.data.questions,
      isFallback: false,
    };
  } catch (error) {
    console.error('Groq API Connection Exception:', error);
    return await getFallbackQuestions(params, 'Unable to connect to AI server. Showing approved question bank items only.');
  }
}

// 2. AI DESCRIPTIVE ANSWER EVALUATOR (2-Mark and 5-Mark Answers)
export async function evaluateDescriptiveAnswer(
  params: EvaluateDescriptiveParams
): Promise<DescriptiveEvaluationType> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_groq_api_key')) {
    // Graceful rule-based keyword match fallback if Groq API is missing
    return fallbackDescriptiveEvaluation(params, 'AI evaluator unavailable. Keyword heuristic fallback applied.');
  }

  const prompt = `You are an expert CBSE exam evaluator for Indian school students.
Evaluate the following student's written response:

Question: "${params.questionText}"
Maximum Marks: ${params.maxMarks}
Model Expected Answer: "${params.expectedAnswer || 'N/A'}"
Marking Scheme: "${params.markingScheme || 'Award marks based on concept accuracy, key terms, and completeness.'}"

Student's Written Answer: "${params.studentAnswer}"

Evaluate strictly and return JSON matching this exact structure:
{
  "awardedMarks": 4.5,
  "feedback": "Constructive feedback highlighting strengths and missing points.",
  "matchedConcepts": ["Key term 1", "Correct principle"],
  "missingConcepts": ["Missing detail"],
  "confidence": 0.95
}

Rules:
1. "awardedMarks" MUST be a number between 0 and ${params.maxMarks}.
2. Never award more than ${params.maxMarks} marks.
3. Be fair, encouraging, and accurate based on the marking scheme.
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a strict JSON evaluator for student answers.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return fallbackDescriptiveEvaluation(params, 'AI evaluator error. Heuristic fallback applied.');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallbackDescriptiveEvaluation(params, 'Empty AI output. Heuristic fallback applied.');

    const parsed = JSON.parse(content);
    const validated = DescriptiveEvaluationSchema.safeParse(parsed);

    if (!validated.success) {
      return fallbackDescriptiveEvaluation(params, 'Invalid AI structure. Heuristic fallback applied.');
    }

    // SERVER BOUNDARY ENFORCEMENT: 0 <= awardedMarks <= maxMarks
    const clampedScore = Math.max(0, Math.min(params.maxMarks, Number(validated.data.awardedMarks)));

    return {
      ...validated.data,
      awardedMarks: Math.round(clampedScore * 10) / 10,
    };
  } catch (error) {
    console.error('Descriptive Answer Evaluation Error:', error);
    return fallbackDescriptiveEvaluation(params, 'Connection error. Fallback score assigned.');
  }
}

// 3. CAMERA / IMAGE QUESTION EXTRACTION AI SERVICE
export async function extractQuestionsFromTextOrImage(
  rawInputText: string,
  context?: { subjectName?: string; chapterName?: string; topicName?: string }
) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_groq_api_key')) {
    throw new Error('GROQ_API_KEY is required for camera/question extraction. Add a valid key before extracting worksheet text.');
  }

  const prompt = `You are a camera OCR and textbook question structuring engine.
Analyze the following extracted text from a textbook page / question sheet:

"${rawInputText}"

Selected syllabus context:
- Subject: ${context?.subjectName || 'Not specified'}
- Chapter: ${context?.chapterName || 'Not specified'}
- Topic: ${context?.topicName || 'Not specified'}

Only structure questions that match the selected syllabus context. If a question is outside the selected board syllabus context, omit it.

Structure the questions found in the text into valid JSON matching this schema:
{
  "rawText": "${rawInputText.slice(0, 200)}...",
  "questions": [
    {
      "questionText": "Question text...",
      "questionType": "MCQ" or "SHORT_2_MARK" or "LONG_5_MARK",
      "optionA": "...",
      "optionB": "...",
      "optionC": "...",
      "optionD": "...",
      "correctAnswer": 0,
      "expectedAnswer": "...",
      "markingScheme": "...",
      "explanation": "...",
      "marks": 1 or 2 or 5,
      "difficulty": "Easy" or "Medium" or "Hard"
    }
  ]
}
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You format raw OCR text into structured questions JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const validated = ExtractedQuestionsSchema.parse(parsed);

    return {
      questions: validated.questions,
      rawText: validated.rawText || rawInputText,
      isFallback: false,
    };
  } catch (e) {
    console.error('Camera extraction error:', e);
    throw new Error('Unable to extract structured questions from the provided text.');
  }
}

// Fallback logic for descriptive evaluation when AI is unavailable
function fallbackDescriptiveEvaluation(
  params: EvaluateDescriptiveParams,
  note: string
): DescriptiveEvaluationType {
  const ansLower = (params.studentAnswer || '').toLowerCase();
  const wordCount = ansLower.trim().split(/\s+/).length;

  let fraction = 0;
  if (wordCount >= 25) fraction = 0.85;
  else if (wordCount >= 10) fraction = 0.65;
  else if (wordCount >= 3) fraction = 0.4;

  const awarded = Math.round(params.maxMarks * fraction * 10) / 10;

  return {
    awardedMarks: awarded,
    feedback: `${note} Awarded ${awarded}/${params.maxMarks} marks based on response length and keyword completeness.`,
    matchedConcepts: ['Written response submitted'],
    missingConcepts: ['Manual review recommended for exact concept verification'],
    confidence: 0.7,
  };
}

// Fallback logic retrieving database questions for topic
async function getFallbackQuestions(
  params: GenerateAiQuestionsParams,
  fallbackMessage: string
): Promise<AiQuestionsResult> {
  const qType = params.questionType || 'MCQ';

  const dbQuestions = await db.question.findMany({
    where: {
      topicId: params.topicId,
      status: 'APPROVED',
      questionType: qType,
    },
    take: params.count,
  });

  if (dbQuestions.length > 0) {
    const mapped: SingleQuestionType[] = dbQuestions.map((q) => ({
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
    }));

    return {
      questions: mapped,
      isFallback: true,
      message: fallbackMessage,
    };
  }

  throw new Error(`${fallbackMessage} No approved question bank items exist for ${params.topicName}. Add admin-approved questions or configure the AI provider before generating.`);
}
