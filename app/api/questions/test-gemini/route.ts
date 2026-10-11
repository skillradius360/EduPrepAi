import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    return NextResponse.json(
      {
        success: false,
        error: 'GEMINI_API_KEY is missing or unconfigured in .env file.',
        model: modelName,
      },
      { status: 400 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Generate 1 basic mathematics MCQ in JSON format with fields: questionText, optionA, optionB, optionC, optionD, correctAnswer (0-3), explanation.',
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text || '';
    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'Gemini returned empty response text.' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(rawText);

    return NextResponse.json({
      success: true,
      message: 'Gemini connection successful',
      modelUsed: modelName,
      generatedQuestion: parsed,
    });
  } catch (error: any) {
    console.error('[Gemini Health Test Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gemini connection failed',
        details: error.status || 'API call exception',
      },
      { status: 500 }
    );
  }
}
