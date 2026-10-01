import { captureStudyQuestion, exampleWord, questionFromFiber } from './study-question';

describe('captureStudyQuestion', () => {
  it('reads the lesson, word type, and form hint from a quiz question', () => {
    const captured = captureStudyQuestion({
      reviewable: {
        title: 'にする',
        lesson_id: 8,
        lesson_count: '8/13',
        part_of_speech: '表現',
        part_of_speech_translation: 'Expression',
        word_type: '動詞',
        word_type_translation: 'Verb',
        metadata:
          'にする, nisuru, expression, verb, irregular, direct control',
      },
      sentence: {
        tense: 'Negative non-past, polite',
        content: 'どちら____。',
      },
    });

    expect(captured).toEqual({
      grammarTitle: 'にする',
      lessonId: '8',
      lessonLabel: 'Lesson 8 (8/13)',
      partOfSpeech: 'Expression',
      wordType: 'Verb',
      word: 'どちら',
      traits: ['expression', 'verb', 'irregular', 'direct control'],
      helpPrompt: 'Negative non-past, polite',
    });
  });
});

describe('questionFromFiber', () => {
  it('finds the question object hanging off an ancestor child', () => {
    const question = {
      reviewable: { title: 'て-form' },
      sentence: { tense: 'Past', content: '食べ____。' },
    };
    const start = {
      return: {
        return: null,
        sibling: null,
        memoizedProps: null,
        child: {
          return: null,
          sibling: null,
          child: null,
          memoizedProps: { question },
        },
      },
      child: null,
      sibling: null,
      memoizedProps: null,
    };

    expect(questionFromFiber(start)).toBe(question);
    expect(exampleWord('食べ____から、出かけます。')).toBe('食べ · から · 出かけます');
    expect(
      exampleWord('コンビニ<span class="gp-popout" data-gp-id="25">で</span>お水（みず）'),
    ).toBe('コンビニ**で**お水（みず）');
    expect(
      exampleWord('<span class="gp-popout" data-gp-id="73"><strong>より</strong></span>'),
    ).toBe('***より***');
  });
});
