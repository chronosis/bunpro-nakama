export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const body = await readBody(event);
  const db = await getDb(String(config.databasePath || ''));
  const result = await importHistory(db, body, new Date().toISOString());
  if (!result.ok) {
    throw createError({ statusCode: 400, statusMessage: result.error });
  }
  return result;
});
