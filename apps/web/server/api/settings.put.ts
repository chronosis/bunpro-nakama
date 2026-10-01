import { z } from 'zod';

const bodySchema = z.object({
  lookbackDays: z.coerce.number().int().min(1).max(365),
  maxSessions: z.coerce.number().int().min(1).max(200),
});

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Lookback must be 1–365 days and sessions must be 1–200.',
    });
  }
  const config = useRuntimeConfig(event);
  const db = await getDb(String(config.databasePath || ''));
  return savePlanSettings(db, parsed.data);
});
