import { eq } from 'drizzle-orm';
import { attempts, sessions } from '../../drizzle/schema';
import type { AppDatabase } from './db';

export async function deleteSession(db: AppDatabase, id: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    if (existing.length === 0) return false;
    await tx.delete(attempts).where(eq(attempts.sessionId, id));
    await tx.delete(sessions).where(eq(sessions.id, id));
    return true;
  });
}
