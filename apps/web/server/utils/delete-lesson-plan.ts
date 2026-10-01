import { eq } from 'drizzle-orm';
import { lessonPlans } from '../../drizzle/schema';
import type { AppDatabase } from './db';

export async function deleteLessonPlan(db: AppDatabase, id: string): Promise<boolean> {
  const existing = await db
    .select({ id: lessonPlans.id })
    .from(lessonPlans)
    .where(eq(lessonPlans.id, id))
    .limit(1);
  if (existing.length === 0) return false;
  await db.delete(lessonPlans).where(eq(lessonPlans.id, id));
  return true;
}
