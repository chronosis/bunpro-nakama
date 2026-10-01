import type { Attempt } from '@bunpro-nakama/session-history';
import { emptyHistory, endActiveSession, recordAttempt, toHistoryExport } from './history-store';

function attempt(id: string): Attempt {
  return {
    id,
    recordedAt: '2026-09-27T00:01:00.000Z',
    url: 'https://bunpro.jp/reviews',
    location: 'review',
    inputMode: 'manual',
    questionMode: 'cloze',
    grammarPoint: null,
    prompt: 'これはペン___。',
    userAnswer: 'だ',
    acceptedAnswers: ['だ'],
    result: 'correct',
    resultSource: 'metadata',
  };
}

describe('recordAttempt', () => {
  it('groups attempts into the Bunpro session and exports them', () => {
    const now = '2026-09-27T00:01:00.000Z';
    const stored = recordAttempt(emptyHistory(), attempt('a1'), 'bunpro:review:9', now);
    const again = recordAttempt(stored, attempt('a2'), 'bunpro:review:9', now);

    expect(again.sessions).toHaveLength(1);
    expect(again.sessions[0]?.attempts).toHaveLength(2);

    const exported = toHistoryExport(again, now);
    expect(exported.format).toBe('bunpro-nakama.history');
    expect(exported.sessions[0]?.id).toBe('bunpro:review:9');
    expect(exported.sessions[0]?.sessionDate).toBe('2026-09-27');
  });

  it('closes the previous session when Bunpro starts another one', () => {
    const first = recordAttempt(
      emptyHistory(),
      attempt('a1'),
      'bunpro:review:1',
      '2026-09-27T00:01:00.000Z',
    );
    const second = recordAttempt(
      first,
      attempt('a2'),
      'bunpro:review:2',
      '2026-09-27T00:05:00.000Z',
    );

    expect(second.sessions[0]?.endedAt).toBe('2026-09-27T00:05:00.000Z');
    expect(endActiveSession(second, '2026-09-27T00:06:00.000Z').activeSessionId).toBeNull();
  });
});
