/// <reference types="vitest/globals" />
import { buildLessonPrompt, parseLessonPlan, type PromptAttempt } from './lesson-plan';

function attempt(partial: Pick<PromptAttempt, 'userAnswer' | 'acceptedAnswers'> & Partial<PromptAttempt>): PromptAttempt {
  return {
    grammarPoint: 'て-form',
    prompt: '___',
    questionMode: 'cloze',
    result: 'incorrect',
    helpPrompt: 'Te-form',
    wordType: 'Verb',
    word: 'どちら',
    traits: ['verb', 'expression'],
    ...partial,
  };
}

describe('lesson plan parsing', () => {
  it('ignores traits and a single conjugation miss', () => {
    const prompt = buildLessonPrompt([
      attempt({
        grammarPoint: 'なければならない',
        prompt: '明日までにレポートを出さ___。',
        userAnswer: 'なきゃ',
        acceptedAnswers: ['なければならない'],
        helpPrompt: 'Negative non-past, polite',
        word: '出す',
      }),
      attempt({
        userAnswer: 'たべた',
        acceptedAnswers: ['食べて'],
      }),
    ]);

    expect(prompt).toContain('なければならない');
    expect(prompt).toContain('なきゃ');
    expect(prompt).not.toContain('Trait');
    expect(prompt).not.toContain('traits:');
    expect(prompt).not.toContain('Word type "Verb"');
    expect(prompt).toContain('No pattern reached 3 misses.');

    const parsed = parseLessonPlan(`\`\`\`json
{"summary":"Obligation forms are slipping.","patterns":[{"title":"Short forms","evidence":"なきゃ was rejected.","suggestion":"Review なければならない vs なきゃいけない."}],"focusItems":[{"label":"なければならない","why":"Two misses.","practice":"Write three obligation sentences."}]}
\`\`\``);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.patterns[0]?.missedQuestions).toEqual([]);
  });

  it('reads a Title line as the heading and leaves the rest as the description', () => {
    const parsed = parseLessonPlan(JSON.stringify({
      summary: 'Title: Te-form misses\nThe student missed the te-form on three questions.',
      patterns: [],
      focusItems: [],
    }));

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.title).toBe('Te-form misses');
    expect(parsed.data.summary).toBe('The student missed the te-form on three questions.');
    expect(parsed.data.summary.startsWith('Title:')).toBe(false);
  });

  it('lists a word stem only after three conjugation misses', () => {
    const prompt = buildLessonPrompt([
      attempt({ userAnswer: 'たべた', acceptedAnswers: ['食べて'] }),
      attempt({ userAnswer: 'たべる', acceptedAnswers: ['食べた'] }),
      attempt({ userAnswer: 'たべない', acceptedAnswers: ['食べます'] }),
      attempt({ userAnswer: 'たかいです', acceptedAnswers: ['高かったです'], grammarPoint: 'い-adjective' }),
      attempt({ userAnswer: 'たかなかった', acceptedAnswers: ['高いです'], grammarPoint: 'い-adjective' }),
      attempt({ userAnswer: 'のんだ', acceptedAnswers: ['飲んで'], grammarPoint: 'て-form' }),
    ]);

    const patterns = prompt.split('Attempts:')[0] ?? '';
    expect(patterns).toContain('Word stem "たべ" (食べる / たべる): 3 misses');
    expect(patterns).toContain('Word type "Verb": 6 misses');
    expect(patterns).toContain('Help prompt "Te-form": 6 misses');
    expect(patterns).not.toContain('Word "どちら"');
    expect(patterns).toContain('Grammar "て-form": 4 misses');
    expect(patterns).not.toContain('Grammar "い-adjective"');
    expect(patterns).not.toContain('高い');
    expect(patterns).not.toContain('飲む');
    expect(prompt).not.toContain('Trait');
    expect(prompt).not.toContain('traits:');
  });

  it('groups the closest accepted answer and ignores the question prompt', () => {
    const question = 'あなたとは考え方が___。 — I think differently to you.';
    const prompt = buildLessonPrompt([
      attempt({
        prompt: question,
        word: question,
        grammarPoint: '違う',
        userAnswer: 'むさく',
        acceptedAnswers: ['ちがいます', 'ちがう'],
        helpPrompt: null,
        wordType: null,
      }),
      attempt({
        prompt: question,
        word: question,
        grammarPoint: '違う',
        userAnswer: 'さぐむ',
        acceptedAnswers: ['ちがいます', 'ちがう'],
        helpPrompt: null,
        wordType: null,
      }),
      attempt({
        prompt: question,
        word: question,
        grammarPoint: '違う',
        userAnswer: 'ちかう',
        acceptedAnswers: ['ちがう', 'ちがいます'],
        helpPrompt: null,
        wordType: null,
      }),
    ]);

    const patterns = prompt.split('Attempts:')[0] ?? '';
    expect(patterns).toContain('Word "ちがう": 3 misses');
    expect(patterns).not.toContain('あなたとは');
    expect(patterns).not.toContain('I think differently');
    expect(prompt).toContain(`question: ${question}`);
  });

  it('turns span tags in the question and word into emphasis', () => {
    const prompt = buildLessonPrompt([
      attempt({
        prompt: 'コンビニ<span class="gp-popout">で</span>お水。',
        word: 'コンビニ<span · class="gp-popout" · data-gp-id="25">で</span>お水',
        userAnswer: 'で',
        acceptedAnswers: ['で'],
      }),
    ]);

    expect(prompt).toContain('question: コンビニ**で**お水。');
    expect(prompt).toContain('word: コンビニ**で**お水');
    expect(prompt).not.toContain('<span');
    expect(prompt).not.toContain('</span>');
  });

  it('turns strong tags into a stronger emphasis', () => {
    const prompt = buildLessonPrompt([
      attempt({
        prompt: 'この<span class="gp-popout"><strong>より</strong></span>その。',
        word: '<span · class="gp-popout" · data-gp-id="73"><strong>より</strong></span>',
        userAnswer: 'より',
        acceptedAnswers: ['より'],
      }),
    ]);

    expect(prompt).toContain('question: この***より***その。');
    expect(prompt).toContain('word: ***より***');
    expect(prompt).not.toContain('<strong');
    expect(prompt).not.toContain('<span');
  });

  it('builds the prompt and the pattern counts from incorrect answers only', () => {
    const prompt = buildLessonPrompt([
      attempt({
        grammarPoint: '違う',
        userAnswer: 'むさく',
        acceptedAnswers: ['ちがう'],
      }),
      attempt({
        grammarPoint: '違う',
        userAnswer: 'さぐむ',
        acceptedAnswers: ['ちがう'],
      }),
      attempt({
        grammarPoint: '違う',
        userAnswer: 'ちかう',
        acceptedAnswers: ['ちがう'],
      }),
      attempt({
        grammarPoint: '安定した項目',
        prompt: '安定した文___。',
        userAnswer: 'です',
        acceptedAnswers: ['です'],
        word: '安定した単語',
        result: 'correct',
      }),
      attempt({
        grammarPoint: '未判定の項目',
        userAnswer: 'かも',
        acceptedAnswers: ['かもしれない'],
        result: 'unknown',
      }),
    ]);

    const patterns = prompt.split('Attempts:')[0] ?? '';
    expect(patterns).toContain('Grammar "違う": 3 misses');
    expect(patterns).not.toContain('安定した項目');
    expect(patterns).not.toContain('未判定の項目');
    expect(prompt).not.toContain('安定した文');
    expect(prompt).not.toContain('安定した単語');
    expect(prompt).not.toContain('result:');
    expect(prompt).not.toContain('mode:');
    expect(prompt).toContain('incorrect answers only');
    expect(prompt).toContain('repeat every missed question that belongs to it');
    expect(prompt).toContain('Put that full list in missedQuestions');
    expect(prompt).toContain('Title: <short summary>');
    expect(prompt).toContain('summary is the description shown under the title');
  });
});
