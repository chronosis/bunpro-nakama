import { calendarDate, emphasizeSpans, selectSessionsForPlan } from '@bunpro-nakama/session-history';
import { inArray } from 'drizzle-orm';
import { createError } from 'h3';
import { z } from 'zod';
import { attempts, sessions } from '../../drizzle/schema';
import type { AppDatabase } from './db';
import { buildLessonPrompt, type PromptAttempt } from './lesson-plan';
import { getPlanSettings } from './settings';

export const lessonPlanRequestSchema = z.object({
  sessionIds: z.array(z.string().min(1)).min(1),
});

export async function lessonPromptForSessions(
  db: AppDatabase,
  requestedIds: string[],
): Promise<{ prompt: string; sessionIds: string[] }> {
  const settings = await getPlanSettings(db);
  const storedSessions = await db.select().from(sessions);
  const allowed = new Set(
    selectSessionsForPlan(storedSessions, settings, calendarDate(new Date())).map((session) => session.id),
  );
  const sessionIds = requestedIds.filter((id) => allowed.has(id));
  if (sessionIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `No selected sessions fall in the last ${settings.lookbackDays} days (limit ${settings.maxSessions}).`,
    });
  }

  const rows = await db.select().from(attempts).where(inArray(attempts.sessionId, sessionIds));
  if (rows.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Those sessions have no recorded answers.' });
  }

  const promptAttempts: PromptAttempt[] = rows
    .filter((row) => row.result === 'incorrect')
    .map((row) => ({
      grammarPoint: cleanMarkup(row.grammarPoint),
      prompt: cleanMarkup(row.prompt),
      questionMode: row.questionMode,
      userAnswer: row.userAnswer,
      acceptedAnswers: JSON.parse(row.acceptedAnswersJson) as string[],
      result: row.result,
      helpPrompt: cleanMarkup(row.helpPrompt),
      lessonLabel: row.lessonLabel,
      partOfSpeech: row.partOfSpeech,
      wordType: row.wordType,
      word: cleanMarkup(row.word),
      traits: JSON.parse(row.traitsJson || '[]') as string[],
    }));
  if (promptAttempts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Those sessions have no incorrect answers.' });
  }

  return { prompt: buildLessonPrompt(promptAttempts), sessionIds };
}

function cleanMarkup(value: string | null): string | null {
  if (!value) return value;
  return emphasizeSpans(value);
}
