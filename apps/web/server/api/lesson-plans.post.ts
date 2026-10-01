import { requestLessonPlan } from '../adapters/gemini';
import { lessonPlans } from '../../drizzle/schema';
import { parseLessonPlan } from '../utils/lesson-plan';
import { lessonPlanRequestSchema, lessonPromptForSessions } from '../utils/plan-prompt';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  if (!config.geminiApiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Set GEMINI_API_KEY in apps/web/.env before generating a lesson plan.',
    });
  }

  const parsed = lessonPlanRequestSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Choose at least one session.' });
  }

  const db = await getDb(String(config.databasePath || ''));
  const { prompt, sessionIds } = await lessonPromptForSessions(db, parsed.data.sessionIds);

  const raw = await requestLessonPlan({
    apiKey: String(config.geminiApiKey),
    model: String(config.geminiModel || 'gemini-3-flash-preview'),
    prompt,
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Gemini request failed';
    throw createError({ statusCode: 502, statusMessage: message });
  });

  const plan = parseLessonPlan(raw);
  if (!plan.success) {
    throw createError({
      statusCode: 502,
      statusMessage: plan.error.issues.map((issue) => issue.message).join('; '),
    });
  }
  const body = plan.data;

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.insert(lessonPlans).values({
    id,
    createdAt,
    model: String(config.geminiModel || ''),
    sessionIdsJson: JSON.stringify(sessionIds),
    summary: body.title,
    bodyJson: JSON.stringify(body),
  });

  return { id, createdAt, summary: body.summary };
});
