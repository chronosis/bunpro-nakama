import { deleteSession } from '../../utils/delete-session';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing session id' });

  const removed = await deleteSession(db, id);
  if (!removed) throw createError({ statusCode: 404, statusMessage: 'Session not found' });
  return { ok: true };
});
