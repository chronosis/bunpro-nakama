import { asc, desc } from 'drizzle-orm';
import { attempts, sessions } from '../../drizzle/schema';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  const rows = await db.select().from(sessions).orderBy(desc(sessions.startedAt));
  const attemptRows = await db.select().from(attempts).orderBy(asc(attempts.recordedAt));

  return rows.map((session) => {
    const sessionAttempts = attemptRows.filter((attempt) => attempt.sessionId === session.id);
    const correct = sessionAttempts.filter((attempt) => attempt.result === 'correct').length;
    return {
      ...session,
      attemptCount: sessionAttempts.length,
      correctCount: correct,
      incorrectCount: sessionAttempts.filter((attempt) => attempt.result === 'incorrect').length,
    };
  });
});
