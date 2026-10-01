import { deleteLessonPlan } from '../../utils/delete-lesson-plan';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing lesson plan id' });

  const removed = await deleteLessonPlan(db, id);
  if (!removed) throw createError({ statusCode: 404, statusMessage: 'Lesson plan not found' });
  return { ok: true };
});
