/// <reference types="vitest/globals" />
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attempts, sessions } from '../../drizzle/schema';
import { openDatabase } from './db';
import { deleteSession } from './delete-session';
import { importHistory } from './import-history';

const samplePath = fileURLToPath(new URL('../../public/sample-history.json', import.meta.url));

describe('deleteSession', () => {
  it('removes the session and its answers', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'nakama-'));
    const db = await openDatabase(join(dir, 'test.sqlite'));
    const payload = JSON.parse(readFileSync(samplePath, 'utf8')) as unknown;
    await importHistory(db, payload, '2026-09-27T12:00:00.000Z');

    const removed = await deleteSession(db, 'bunpro:review:sample');
    expect(removed).toBe(true);
    expect(await db.select().from(sessions)).toHaveLength(0);
    expect(await db.select().from(attempts)).toHaveLength(0);
    expect(await deleteSession(db, 'bunpro:review:sample')).toBe(false);
  });
});
