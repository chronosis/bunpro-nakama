import { eq } from 'drizzle-orm';
import { lessonPlans } from '../../../drizzle/schema';
import { lessonPlanBodySchema } from '../../utils/lesson-plan';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing lesson plan id' });

  const [row] = await db.select().from(lessonPlans).where(eq(lessonPlans.id, id)).limit(1);
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Lesson plan not found' });

  return {
    id: row.id,
    createdAt: row.createdAt,
    model: row.model,
    sessionIds: JSON.parse(row.sessionIdsJson) as string[],
    plan: lessonPlanBodySchema.parse(JSON.parse(row.bodyJson)),
  };
});
