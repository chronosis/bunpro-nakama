import {
  grammarPointFromInfo,
  parseQuizMetadata,
  resultFromMetadata,
  sessionKey,
  shouldRecord,
} from './quiz-meta';

function metaElement(attrs: Record<string, string>): HTMLElement {
  const element = document.createElement('div');
  element.id = 'quiz-metadata-element';
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  return element;
}

describe('parseQuizMetadata', () => {
  it('reads the attributes Bunpro copies from quiz state', () => {
    const parsed = parseQuizMetadata(
      metaElement({
        'data-meta-loc': 'review',
        'data-meta-session-id': '42',
        'data-meta-input': 'だ',
        'data-meta-is-correct': 'true',
        'data-meta-is-post-attempt': 'true',
        'data-meta-is-revealing': 'false',
        'data-meta-input-mode': 'manual',
        'data-meta-question-mode': 'cloze',
        'data-meta-answers-array': JSON.stringify(['だ', 'です']),
        'data-meta-total-submissions-count': '3',
        'data-meta-info': 'null',
      }),
    );

    expect(parsed).toMatchObject({
      loc: 'review',
      sessionId: '42',
      input: 'だ',
      isCorrect: true,
      isPostAttempt: true,
      inputMode: 'manual',
      questionMode: 'cloze',
      acceptedAnswers: ['だ', 'です'],
      totalSubmissions: 3,
    });
    expect(sessionKey(parsed)).toBe('bunpro:review:42');
    expect(resultFromMetadata(parsed)).toEqual({
      result: 'correct',
      resultSource: 'metadata',
    });
  });

  it('records once per submission and arms again after the next question', () => {
    const submitted = parseQuizMetadata(
      metaElement({
        'data-meta-is-post-attempt': 'true',
        'data-meta-is-correct': 'false',
        'data-meta-input': 'です',
      }),
    );
    const waiting = parseQuizMetadata(
      metaElement({
        'data-meta-is-post-attempt': 'false',
        'data-meta-is-correct': 'null',
        'data-meta-input': '',
      }),
    );

    const first = shouldRecord({ awaitingReset: false }, submitted);
    const duplicate = shouldRecord(first.gate, submitted);
    const reset = shouldRecord(duplicate.gate, waiting);
    const second = shouldRecord(reset.gate, submitted);

    expect(first.record).toBe(true);
    expect(duplicate.record).toBe(false);
    expect(second.record).toBe(true);
  });

  it('falls back to the accepted-answer list when correctness is still null', () => {
    const parsed = parseQuizMetadata(
      metaElement({
        'data-meta-is-correct': 'null',
        'data-meta-input': ' です ',
        'data-meta-answers-array': '["だ","です"]',
      }),
    );

    expect(resultFromMetadata(parsed).result).toBe('correct');
  });
});

describe('grammarPointFromInfo', () => {
  it('reads a title nested on the reviewable payload', () => {
    expect(
      grammarPointFromInfo(JSON.stringify({ reviewable: { title: 'て-form' } })),
    ).toBe('て-form');
  });

  it('falls back to the reviewable id when the live payload has no title', () => {
    expect(grammarPointFromInfo(JSON.stringify({ id: 84, type: 'grammar_point' }))).toBe(
      'grammar_point #84',
    );
  });
});
