import {
  emphasizeSpans,
  HISTORY_FORMAT,
  HISTORY_VERSION,
  parseHistoryExport,
  selectSessionsForPlan,
} from './session-history.js';

describe('parseHistoryExport', () => {
  it('accepts a versioned session export', () => {
    const parsed = parseHistoryExport({
      format: HISTORY_FORMAT,
      version: HISTORY_VERSION,
      exportedAt: '2026-09-27T00:00:00.000Z',
      sessions: [
        {
          id: 'bunpro:review:1',
          startedAt: '2026-09-27T00:00:00.000Z',
          endedAt: null,
          attempts: [
            {
              id: 'attempt-1',
              recordedAt: '2026-09-27T00:01:00.000Z',
              url: 'https://bunpro.jp/reviews',
              location: 'review',
              inputMode: 'manual',
              questionMode: 'cloze',
              grammarPoint: 'だ',
              prompt: 'これはペン___。',
              userAnswer: 'だ',
              acceptedAnswers: ['だ', 'です'],
              result: 'correct',
              resultSource: 'metadata',
            },
          ],
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects an unknown export format', () => {
    const parsed = parseHistoryExport({
      format: 'something-else',
      version: 1,
      exportedAt: '2026-09-27T00:00:00.000Z',
      sessions: [],
    });

    expect(parsed.success).toBe(false);
  });
});

describe('selectSessionsForPlan', () => {
  const sessions = [
    { id: 'old', startedAt: '2026-08-01T10:00:00.000Z', sessionDate: '2026-08-01' },
    { id: 'mid', startedAt: '2026-09-15T10:00:00.000Z', sessionDate: '2026-09-15' },
    { id: 'new', startedAt: '2026-09-28T10:00:00.000Z', sessionDate: '2026-09-28' },
    { id: 'newer-later', startedAt: '2026-09-20T12:00:00.000Z', sessionDate: '2026-09-20' },
  ];

  it('keeps the newest sessions inside the default 14-day lookback', () => {
    const selected = selectSessionsForPlan(
      sessions,
      { lookbackDays: 14, maxSessions: 15 },
      '2026-09-28',
    );

    expect(selected.map((session) => session.id)).toEqual(['new', 'newer-later', 'mid']);
  });

  it('caps the number of sessions after the date filter', () => {
    const selected = selectSessionsForPlan(
      sessions,
      { lookbackDays: 14, maxSessions: 2 },
      '2026-09-28',
    );

    expect(selected.map((session) => session.id)).toEqual(['new', 'newer-later']);
  });
});

describe('emphasizeSpans', () => {
  it('turns span tags into markdown emphasis', () => {
    expect(emphasizeSpans('<span class="gp-popout" data-gp-id="25">で</span>')).toBe('**で**');
    expect(emphasizeSpans('コンビニ<span · class="gp-popout" · data-gp-id="25">で</span>お水')).toBe(
      'コンビニ**で**お水',
    );
    expect(emphasizeSpans('<span class="a"><span class="b">あの</span></span>')).toBe('**あの**');
    expect(emphasizeSpans('<span>この</span><span>その</span>')).toBe('**この****その**');
    expect(emphasizeSpans('どちら____。')).toBe('どちら____。');
  });

  it('turns strong tags into a stronger emphasis', () => {
    expect(emphasizeSpans('<strong>より</strong>')).toBe('***より***');
    expect(emphasizeSpans('<span class="gp-popout" data-gp-id="73"><strong>より</strong></span>')).toBe(
      '***より***',
    );
    expect(
      emphasizeSpans('<span · class="gp-popout" · data-gp-id="73"><strong>より</strong></span>'),
    ).toBe('***より***');
    expect(emphasizeSpans('<strong><span>より</span></strong>')).toBe('***より***');
  });
});
