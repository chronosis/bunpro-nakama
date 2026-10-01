import { parseHistoryExport, type Attempt, type HistoryExport } from '@bunpro-nakama/session-history';
import { eq } from 'drizzle-orm';
import { attempts, sessions } from '../../drizzle/schema';
import type { AppDatabase } from './db';

export interface ImportCounts {
  importedSessions: number;
  skippedSessions: number;
  importedAttempts: number;
}

export async function importHistory(db: AppDatabase, input: unknown, importedAt: string) {
  const parsed = parseHistoryExport(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((issue) => issue.message).join('; '),
    };
  }
  const counts = await insertHistory(db, parsed.data, importedAt);
  return { ok: true as const, ...counts };
}

async function insertHistory(
  db: AppDatabase,
  history: HistoryExport,
  importedAt: string,
): Promise<ImportCounts> {
  const counts: ImportCounts = {
    importedSessions: 0,
    skippedSessions: 0,
    importedAttempts: 0,
  };

  for (const session of history.sessions) {
    const existing = await db.select().from(sessions).where(eq(sessions.id, session.id)).limit(1);
    if (existing.length > 0) {
      counts.skippedSessions += 1;
      continue;
    }

    await db.insert(sessions).values({
      id: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      sessionDate: session.sessionDate ?? session.startedAt.slice(0, 10),
      importedAt,
    });
    if (session.attempts.length > 0) {
      await db.insert(attempts).values(session.attempts.map((attempt) => toRow(attempt, session.id)));
    }
    counts.importedSessions += 1;
    counts.importedAttempts += session.attempts.length;
  }

  return counts;
}

function toRow(attempt: Attempt, sessionId: string) {
  return {
    id: attempt.id,
    sessionId,
    recordedAt: attempt.recordedAt,
    url: attempt.url,
    location: attempt.location,
    inputMode: attempt.inputMode,
    questionMode: attempt.questionMode,
    grammarPoint: attempt.grammarPoint,
    prompt: attempt.prompt,
    userAnswer: attempt.userAnswer,
    acceptedAnswersJson: JSON.stringify(attempt.acceptedAnswers),
    result: attempt.result,
    resultSource: attempt.resultSource,
    helpPrompt: attempt.helpPrompt ?? null,
    lessonId: attempt.lessonId ?? null,
    lessonLabel: attempt.lessonLabel ?? null,
    partOfSpeech: attempt.partOfSpeech ?? null,
    wordType: attempt.wordType ?? null,
    word: attempt.word ?? null,
    traitsJson: JSON.stringify(attempt.traits ?? []),
  };
}
