/// <reference types="vitest/globals" />
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lessonPlans } from '../../drizzle/schema';
import { openDatabase } from './db';
import { deleteLessonPlan } from './delete-lesson-plan';

describe('deleteLessonPlan', () => {
  it('removes the lesson plan', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'nakama-plan-'));
    const db = await openDatabase(join(dir, 'test.sqlite'));
    await db.insert(lessonPlans).values({
      id: 'plan-1',
      createdAt: '2026-09-28T00:00:00.000Z',
      model: 'test',
      sessionIdsJson: '[]',
      summary: 'Te-form misses',
      bodyJson: JSON.stringify({
        title: 'Te-form misses',
        summary: 'The student missed the te-form.',
        patterns: [],
        focusItems: [],
      }),
    });

    expect(await deleteLessonPlan(db, 'plan-1')).toBe(true);
    expect(await db.select().from(lessonPlans)).toHaveLength(0);
    expect(await deleteLessonPlan(db, 'plan-1')).toBe(false);
  });
});
