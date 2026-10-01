import { emphasizeSpans } from '@bunpro-nakama/session-history';
import { asc, eq } from 'drizzle-orm';
import { attempts, sessions } from '../../../drizzle/schema';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing session id' });

  const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!session) throw createError({ statusCode: 404, statusMessage: 'Session not found' });

  const rows = await db
    .select()
    .from(attempts)
    .where(eq(attempts.sessionId, id))
    .orderBy(asc(attempts.recordedAt));

  return {
    session,
    attempts: rows.map((row) => ({
      ...row,
      grammarPoint: cleanMarkup(row.grammarPoint),
      prompt: cleanMarkup(row.prompt),
      helpPrompt: cleanMarkup(row.helpPrompt),
      word: cleanMarkup(row.word),
      acceptedAnswers: JSON.parse(row.acceptedAnswersJson) as string[],
      traits: JSON.parse(row.traitsJson || '[]') as string[],
    })),
  };
});

function cleanMarkup(value: string | null): string | null {
  if (!value) return value;
  return emphasizeSpans(value);
}
