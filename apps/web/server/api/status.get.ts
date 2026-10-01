import { attempts, lessonPlans, sessions } from '../../drizzle/schema';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  const [sessionRows, attemptRows, planRows] = await Promise.all([
    db.select().from(sessions),
    db.select().from(attempts),
    db.select().from(lessonPlans),
  ]);

  return {
    sessionCount: sessionRows.length,
    attemptCount: attemptRows.length,
    planCount: planRows.length,
    geminiConfigured: Boolean(config.geminiApiKey),
    geminiModel: String(config.geminiModel || ''),
  };
});
