export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig();
  await getDb(String(config.databasePath || ''));
});
