import { GeminiQuestionGenerationInput } from './schemas';

export const EDUPREP_SYSTEM_INSTRUCTION = `You are EduPrep AI, an advanced educational AI question generator and competitive examination predictive engine.
You specialize across three distinct tiers:
1. SCHOOL (CBSE, ICSE, State Boards: Class 6-12)
2. COLLEGE (Higher Education UG & PG: B.Tech, B.Sc, BCA, MBBS, B.Com, MBA, M.Tech following UGC Model Curriculum or Custom University Syllabi)
3. COMPETITIVE EXAMINATIONS (GATE, NExT / NEET PG, CET, CAT)

STRICT RULES:
1. Generate questions strictly from the requested tier, syllabus regulation, exam, subject, chapter, and topic.
2. For COMPETITIVE PYQ (Previous Year Questions) Mode:
   - Accurately recreate the exact rigorous format and style of real past examination papers (GATE, NExT, CAT, CET).
   - If an official paper year is specified, tailor questions and patterns representing that era.
   - Tag with appropriate examName and paperYear.
3. For FUTURE PROBABLE / PREDICTED QUESTIONS Mode:
   - Synthesize frequent high-yield topics, recent syllabus revisions, and recurring conceptual traps from the past 10 years of exams.
   - Formulate novel, unrepeated high-probability questions likely to appear in upcoming exam sessions.
   - Set isProbableFuture: true and provide a concrete "predictionRationale" explaining the conceptual weightage.
4. For COLLEGE (UG/PG) UGC vs Custom University Syllabus:
   - Respect university level depth (e.g. proof-based, system architecture, clinical vignette, algorithm complexity).
   - UGC Model Curriculums emphasize core foundational benchmarks; Custom University syllabi emphasize specified university semester modules.
5. Question Types:
   - MCQ: Exactly four distinct options (optionA, optionB, optionC, optionD) with correctAnswer (0 to 3).
   - NAT (Numerical Answer Type for GATE/CAT): option fields null, expectedAnswer contains numerical value/range, markingScheme explains decimal tolerance.
   - SHORT_2_MARK & LONG_5_MARK: option fields null, expectedAnswer + markingScheme provided with rubric breakdown.
6. Return structured JSON only without markdown formatting.
`;

export function buildGeminiQuestionPrompt(input: GeminiQuestionGenerationInput): string {
  const qType = input.questionType || 'MCQ';
  const targetMarks = qType === 'MCQ' ? 1 : qType === 'SHORT_2_MARK' ? 2 : qType === 'NAT' ? 2 : 5;
  const uniqueSeed = `seed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const isCompetitive = input.tier === 'COMPETITIVE' || !!input.examName;
  const isCollege = input.tier === 'COLLEGE';
  const isPYQ = input.generationMode === 'PYQ';
  const isFutureProbable = input.generationMode === 'FUTURE_PROBABLE';

  let modeDirective = '';
  if (isPYQ) {
    modeDirective = `
MODE: AUTHENTIC PREVIOUS YEAR QUESTION (PYQ) EMULATION
- Faithfully reflect the style, technical depth, question framing, and difficulty of official ${input.examName || input.exam} previous papers${input.targetYear ? ` (Target Era: ${input.targetYear})` : ''}.
- Include realistic distractor options and standard exam conventions.
- Set paperYear: ${input.targetYear || 2023}, examName: "${input.examName || input.exam}", isProbableFuture: false.`;
  } else if (isFutureProbable) {
    modeDirective = `
MODE: FUTURE PROBABLE & TREND PREDICTION FOR UPCOMING EXAM
- Analyze historical frequency trends of "${input.topicName}" in ${input.examName || input.exam}.
- Generate brand-new, unseen questions that test high-yield edge cases or interdisciplinary applications most probable to appear in the next exam cycle.
- Set isProbableFuture: true, examName: "${input.examName || input.exam}".
- Provide a detailed "predictionRationale" explaining why this concept has high probability (e.g. "Tested in 4 of last 6 GATE cycles with evolving difficulty on cache coherence").`;
  }

  let syllabusGuidance = '';
  if (isCollege) {
    syllabusGuidance = `
COLLEGE CURRICULUM CONTEXT:
- Tier: Higher Education (UG / PG)
- Degree / Major: ${input.degreeMajor || 'Undergraduate'}
- Syllabus Model: ${input.syllabusType === 'UGC_MODEL' ? 'UGC Model Curriculum' : input.syllabusType === 'CUSTOM_UNIVERSITY' ? `Custom University Syllabus (${input.universityName || 'Autonomous University'})` : 'University Curriculum'}
- Semester: ${input.semester ? `Semester ${input.semester}` : 'Standard'}
Ensure university-grade rigorous conceptual depth, formal terminology, and appropriate engineering/science/management problem formulations.`;
  }

  return `Generate strictly ${input.numberOfQuestions} BRAND NEW, RIGOROUS, and NON-REPEATING questions of type "${qType}" worth ${targetMarks} marks each.

Target Academic Hierarchy:
- Tier: ${input.tier || 'SCHOOL'}
- Examination / Target: ${input.examName || input.exam || 'CBSE Exam'}
- Degree / Level: ${input.degreeMajor || input.classLevel || 'Class 10'}
- Board / Regulation: ${input.board || 'CBSE / UGC'}
- Subject: ${input.subjectName}
- Chapter / Module: ${input.chapterName}
- Topic: ${input.topicName}
- Difficulty: ${input.difficulty}
- Question Type: ${qType}
- Quantity: ${input.numberOfQuestions}
- Generation Session Seed: ${uniqueSeed}
${syllabusGuidance}
${modeDirective}
${input.syllabusContext ? `\nVerified Syllabus / Source Context:\n${input.syllabusContext}\n` : ''}

Required JSON Output Structure:
{
  "questions": [
    {
      "questionText": "Detailed question text with precise equations, data, or scenario",
      "questionType": "${qType}",
      "optionA": ${qType === 'MCQ' ? '"Option A text"' : 'null'},
      "optionB": ${qType === 'MCQ' ? '"Option B text"' : 'null'},
      "optionC": ${qType === 'MCQ' ? '"Option C text"' : 'null'},
      "optionD": ${qType === 'MCQ' ? '"Option D text"' : 'null'},
      "correctAnswer": ${qType === 'MCQ' ? 0 : 'null'},
      "expectedAnswer": ${qType !== 'MCQ' ? '"Comprehensive model answer or exact numerical value/range..."' : 'null'},
      "markingScheme": ${qType !== 'MCQ' ? '"Marking guidelines..."' : 'null'},
      "explanation": "Clear step-by-step educational explanation and derivation.",
      "difficulty": "${input.difficulty}",
      "marks": ${targetMarks},
      "examName": "${input.examName || input.exam || 'CBSE'}",
      "paperYear": ${input.targetYear || (isPYQ ? 2023 : null)},
      "paperSession": ${isPYQ ? '"Official Session"' : 'null'},
      "isProbableFuture": ${isFutureProbable ? 'true' : 'false'},
      "predictionRationale": ${isFutureProbable ? '"Predicted based on recurring high-yield concept pattern..."' : 'null'}
    }
  ]
}
`;
}
