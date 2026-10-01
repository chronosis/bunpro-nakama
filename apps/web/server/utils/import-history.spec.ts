/// <reference types="vitest/globals" />
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { attempts } from '../../drizzle/schema';
import { openDatabase } from './db';
import { importHistory } from './import-history';

const samplePath = fileURLToPath(new URL('../../public/sample-history.json', import.meta.url));

describe('importHistory', () => {
  it('stores a session once and skips the same export on the next import', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'nakama-'));
    const db = await openDatabase(join(dir, 'test.sqlite'));
    const payload = JSON.parse(readFileSync(samplePath, 'utf8')) as unknown;

    const first = await importHistory(db, payload, '2026-09-27T12:00:00.000Z');
    const second = await importHistory(db, payload, '2026-09-27T12:05:00.000Z');

    expect(first).toMatchObject({ ok: true, importedSessions: 1, importedAttempts: 3, skippedSessions: 0 });
    expect(second).toMatchObject({ ok: true, importedSessions: 0, skippedSessions: 1, importedAttempts: 0 });

    const [row] = await db.select().from(attempts).where(eq(attempts.id, 'sample-attempt-2')).limit(1);
    expect(row?.helpPrompt).toBe('Negative non-past, polite');
    expect(row?.wordType).toBe('Verb');
    expect(row?.word).toBe('出す');
    expect(row?.lessonLabel).toBe('Lesson 8 (8/13)');
  });

  it('rejects a file that is not a Nakama export', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'nakama-'));
    const db = await openDatabase(join(dir, 'test.sqlite'));
    const result = await importHistory(db, { hello: 'world' }, '2026-09-27T12:00:00.000Z');
    expect(result.ok).toBe(false);
  });
});
