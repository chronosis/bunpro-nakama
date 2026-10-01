export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  return getPlanSettings(db);
});
