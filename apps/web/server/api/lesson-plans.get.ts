import { desc } from 'drizzle-orm';
import { lessonPlans } from '../../drizzle/schema';
import { lessonPlanBodySchema } from '../utils/lesson-plan';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  const rows = await db.select().from(lessonPlans).orderBy(desc(lessonPlans.createdAt));
  return rows.map((row) => {
    const parsed = lessonPlanBodySchema.safeParse(JSON.parse(row.bodyJson));
    return {
      id: row.id,
      createdAt: row.createdAt,
      model: row.model,
      title: parsed.success ? parsed.data.title : row.summary,
      summary: parsed.success ? parsed.data.summary : '',
      sessionIds: JSON.parse(row.sessionIdsJson) as string[],
    };
  });
});

