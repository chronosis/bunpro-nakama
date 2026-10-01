import { GoogleGenAI } from '@google/genai';
import { LESSON_PLAN_JSON_SCHEMA } from '../utils/lesson-plan';

export async function requestLessonPlan(options: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<string> {
  const started = Date.now();
  console.info(
    `[bunpro-nakama] Gemini request starting model=${options.model} promptChars=${options.prompt.length} retries=0`,
  );
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  let interaction;
  try {
    interaction = await ai.interactions.create(
      {
        model: options.model,
        input: options.prompt,
        store: false,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: LESSON_PLAN_JSON_SCHEMA,
        },
      },
      { retries: { strategy: 'none' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini request failed';
    console.error(
      `[bunpro-nakama] Gemini request failed after ${Date.now() - started}ms: ${message}`,
    );
    throw error;
  }
  const text = interaction.output_text?.trim();
  console.info(
    `[bunpro-nakama] Gemini request finished in ${Date.now() - started}ms id=${interaction.id} chars=${text?.length ?? 0}`,
  );
  if (!text) {
    throw new Error('Gemini returned an empty lesson plan');
  }
  return text;
}
