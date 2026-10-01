import { eq } from 'drizzle-orm';
import { DEFAULT_LOOKBACK_DAYS, DEFAULT_MAX_SESSIONS, type PlanWindow } from '@bunpro-nakama/session-history';
import { planSettings } from '../../drizzle/schema';
import type { AppDatabase } from './db';

const SETTINGS_ID = 'plan';

export async function getPlanSettings(db: AppDatabase): Promise<PlanWindow> {
  const [row] = await db.select().from(planSettings).where(eq(planSettings.id, SETTINGS_ID)).limit(1);
  if (!row) {
    const created = { lookbackDays: DEFAULT_LOOKBACK_DAYS, maxSessions: DEFAULT_MAX_SESSIONS };
    await db.insert(planSettings).values({ id: SETTINGS_ID, ...created });
    return created;
  }
  return { lookbackDays: row.lookbackDays, maxSessions: row.maxSessions };
}

export async function savePlanSettings(db: AppDatabase, window: PlanWindow): Promise<PlanWindow> {
  await getPlanSettings(db);
  await db.update(planSettings).set(window).where(eq(planSettings.id, SETTINGS_ID));
  return window;
}
