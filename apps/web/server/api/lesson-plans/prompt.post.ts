import { lessonPlanRequestSchema, lessonPromptForSessions } from '../../utils/plan-prompt';

export default defineEventHandler(async (event) => {
  const parsed = lessonPlanRequestSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Choose at least one session.' });
  }

  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  const { prompt } = await lessonPromptForSessions(db, parsed.data.sessionIds);
  return { prompt };
});
