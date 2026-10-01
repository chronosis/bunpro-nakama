/// <reference types="vitest/globals" />
import {
  answerMatches,
  furiganaParts,
  verbForms,
  VERBS,
  type Verb,
} from './verb-drill';

function findVerb(lemma: string): Verb {
  const verb = VERBS.find((item) => item.lemma === lemma);
  if (!verb) throw new Error(`missing verb ${lemma}`);
  return verb;
}

describe('verbForms', () => {
  it('conjugates 食べる as ichidan, including progressive contractions', () => {
    const forms = verbForms(findVerb('食べる'));
    expect(forms.dictionary.casual).toEqual(['たべる']);
    expect(forms.negative.casual).toEqual(['たべない']);
    expect(forms.te.casual).toEqual(['たべて']);
    expect(forms.past.casual).toEqual(['たべた']);
    expect(forms.pastNegative.casual).toEqual(['たべなかった']);
    expect(forms.volitional.casual).toEqual(['たべよう']);
    expect(forms.progressive.casual).toEqual(['たべている', 'たべてる']);
    expect(forms.progressiveNegative.casual).toEqual(['たべていない', 'たべてない']);
    expect(forms.desire.casual).toEqual(['たべたい']);
    expect(forms.desireNegative.casual).toEqual(['たべたくない']);
    expect(forms.dictionary.polite).toEqual(['たべます']);
    expect(forms.negative.polite).toEqual(['たべません']);
    expect(forms.te.polite).toEqual(['たべまして']);
    expect(forms.past.polite).toEqual(['たべました']);
    expect(forms.pastNegative.polite).toEqual(['たべませんでした']);
    expect(forms.volitional.polite).toEqual(['たべましょう']);
    expect(forms.progressive.polite).toEqual(['たべています', 'たべてます']);
    expect(forms.progressiveNegative.polite).toEqual(['たべていません', 'たべてません']);
    expect(forms.desire.polite).toEqual(['たべたいです']);
    expect(forms.desireNegative.polite).toEqual(['たべたくないです', 'たべたくありません']);
    expect(forms.permissive.casual).toEqual(['たべてもいい']);
    expect(forms.permissive.polite).toEqual(['たべてもいいです']);
    expect(forms.permissiveNegative.casual).toEqual(['たべなくてもいい']);
    expect(forms.permissiveNegative.polite).toEqual(['たべなくてもいいです']);
    expect(forms.compulsive.casual[0]).toBe('たべなくてはいけない');
    expect(forms.compulsive.casual).toContain('たべなきゃいけない');
    expect(forms.compulsive.polite[0]).toBe('たべなくてはいけません');
    expect(forms.compulsiveNegative.casual).toEqual(['たべてはいけない', 'たべちゃいけない']);
    expect(forms.compulsiveNegative.polite).toEqual(['たべてはいけません', 'たべちゃいけません']);
    expect(forms.advice.casual).toEqual(['たべたほうがいい']);
    expect(forms.advice.polite).toEqual(['たべたほうがいいです']);
    expect(forms.adviceNegative.casual).toEqual(['たべないほうがいい']);
    expect(forms.adviceNegative.polite).toEqual(['たべないほうがいいです']);
  });

  it('conjugates 書く godan te, ta, negative, and volitional', () => {
    const forms = verbForms(findVerb('書く'));
    expect(forms.te.casual).toEqual(['かいて']);
    expect(forms.past.casual).toEqual(['かいた']);
    expect(forms.negative.casual).toEqual(['かかない']);
    expect(forms.volitional.casual).toEqual(['かこう']);
  });

  it('uses いって for 行く and keeps polite いきます', () => {
    const forms = verbForms(findVerb('行く'));
    expect(forms.te.casual).toEqual(['いって']);
    expect(forms.past.casual).toEqual(['いった']);
    expect(forms.te.casual).not.toContain('いいて');
    expect(forms.past.casual).not.toContain('いいた');
    expect(forms.dictionary.polite).toEqual(['いきます']);
    expect(forms.permissive.casual).toEqual(['いってもいい']);
    expect(forms.advice.casual).toEqual(['いったほうがいい']);
    expect(forms.compulsiveNegative.casual[0]).toBe('いってはいけない');
  });

  it('accepts 泳ぐ te, ta, and the progressive contraction', () => {
    const forms = verbForms(findVerb('泳ぐ'));
    expect(forms.te.casual).toEqual(['およいで']);
    expect(forms.past.casual).toEqual(['およいだ']);
    expect(forms.progressive.casual).toContain('およいでる');
    expect(forms.progressiveNegative.casual).toEqual(['およいでいない', 'およいでない']);
    expect(forms.progressiveNegative.polite).toEqual(['およいでいません', 'およいでません']);
    expect(forms.desireNegative.casual).toEqual(['およぎたくない']);
    expect(forms.permissive.casual).toEqual(['およいでもいい']);
    expect(forms.compulsiveNegative.casual).toEqual(['およいではいけない', 'およいじゃいけない']);
    expect(forms.advice.casual).toEqual(['およいだほうがいい']);
    expect(forms.adviceNegative.casual).toEqual(['およがないほうがいい']);
  });

  it('treats ある casual negative as ない and polite as ありません', () => {
    const forms = verbForms(findVerb('ある'));
    expect(forms.negative.casual).toEqual(['ない']);
    expect(forms.negative.casual).not.toContain('あらない');
    expect(forms.pastNegative.casual).toEqual(['なかった']);
    expect(forms.negative.polite).toEqual(['ありません']);
    expect(forms.permissiveNegative.casual).toEqual(['なくてもいい']);
    expect(forms.compulsive.casual[0]).toBe('なくてはいけない');
    expect(forms.adviceNegative.casual).toEqual(['ないほうがいい']);
  });

  it('conjugates する and 来る as irregulars', () => {
    const suru = verbForms(findVerb('する'));
    expect(suru.negative.casual).toEqual(['しない']);
    expect(suru.pastNegative.casual).toEqual(['しなかった']);
    expect(suru.volitional.casual).toEqual(['しよう']);
    expect(suru.dictionary.polite).toEqual(['します']);
    expect(suru.te.casual).toEqual(['して']);
    expect(suru.past.casual).toEqual(['した']);
    expect(suru.desire.casual).toEqual(['したい']);
    expect(suru.desireNegative.casual).toEqual(['したくない']);
    expect(suru.progressiveNegative.casual).toEqual(['していない', 'してない']);
    expect(suru.permissive.casual).toEqual(['してもいい']);
    expect(suru.permissiveNegative.casual).toEqual(['しなくてもいい']);
    expect(suru.advice.casual).toEqual(['したほうがいい']);

    const kuru = verbForms(findVerb('来る'));
    expect(kuru.negative.casual).toEqual(['こない']);
    expect(kuru.pastNegative.casual).toEqual(['こなかった']);
    expect(kuru.volitional.casual).toEqual(['こよう']);
    expect(kuru.dictionary.polite).toEqual(['きます']);
    expect(kuru.te.casual).toEqual(['きて']);
    expect(kuru.past.casual).toEqual(['きた']);
    expect(kuru.desire.casual).toEqual(['きたい']);
    expect(kuru.desireNegative.polite).toEqual(['きたくないです', 'きたくありません']);
    expect(kuru.progressiveNegative.casual).toEqual(['きていない', 'きてない']);
    expect(kuru.permissiveNegative.casual).toEqual(['こなくてもいい']);
    expect(kuru.compulsive.casual[0]).toBe('こなくてはいけない');
    expect(kuru.advice.casual).toEqual(['きたほうがいい']);
    expect(kuru.adviceNegative.casual).toEqual(['こないほうがいい']);
  });
});

describe('furiganaParts', () => {
  it('splits kanji readings from trailing okurigana', () => {
    expect(furiganaParts('食べる', 'たべる')).toEqual([
      { text: '食', reading: 'た' },
      { text: 'べる' },
    ]);
    expect(furiganaParts('来る', 'くる')).toEqual([
      { text: '来', reading: 'く' },
      { text: 'る' },
    ]);
    expect(furiganaParts('する', 'する')).toEqual([{ text: 'する' }]);
  });
});

describe('answerMatches', () => {
  it('grades romaji against hiragana and treats empty input as a miss', () => {
    expect(answerMatches('tabemasu', ['たべます'])).toBe(true);
    expect(answerMatches('', ['たべます'])).toBe(false);
    expect(answerMatches('   ', ['たべます'])).toBe(false);
  });
});

describe('VERBS', () => {
  it('includes a large mix of ichidan, godan, and irregular verbs', () => {
    expect(VERBS.length).toBeGreaterThanOrEqual(70);
    expect(VERBS.every((verb) => verb.meaning.startsWith('to '))).toBe(true);
    expect(findVerb('走る').meaning).toBe('to run');
    expect(findVerb('遊ぶ').meaning).toBe('to play');
    expect(VERBS.some((verb) => verb.wordClass === 'ichidan')).toBe(true);
    expect(VERBS.some((verb) => verb.wordClass === 'godan')).toBe(true);
    expect(VERBS.some((verb) => verb.wordClass === 'suru')).toBe(true);
    expect(VERBS.some((verb) => verb.wordClass === 'kuru')).toBe(true);
    expect(VERBS.some((verb) => verb.wordClass === 'iku')).toBe(true);
    expect(VERBS.some((verb) => verb.wordClass === 'aru')).toBe(true);
    expect(findVerb('切る').wordClass).toBe('godan');
    expect(findVerb('着る').wordClass).toBe('ichidan');
    expect(findVerb('帰る').wordClass).toBe('godan');
    expect(findVerb('変える').wordClass).toBe('ichidan');
  });

  it('includes godan verbs that look like ichidan and conjugates them as godan', () => {
    const fakeIchidan = [
      '入る',
      '切る',
      '走る',
      '知る',
      '要る',
      '煎る',
      '帰る',
      '返る',
      '減る',
      '焦る',
      '滑る',
      '限る',
      '握る',
      '練る',
      '混じる',
      '交じる',
      '喋る',
      '湿る',
      '散る',
      '照る',
      '参る',
      '蹴る',
      '罵る',
      '弄る',
      '捻る',
      '茂る',
      '遮る',
      '嘲る',
      '齧る',
      '翻る',
    ];
    for (const lemma of fakeIchidan) {
      const verb = findVerb(lemma);
      expect(verb.wordClass).toBe('godan');
      expect(verb.reading.endsWith('る')).toBe(true);
      const negative = verbForms(verb).negative.casual[0];
      expect(negative?.endsWith('らない')).toBe(true);
      expect(negative).not.toBe(`${verb.reading.slice(0, -1)}ない`);
    }
    expect(findVerb('要る').reading).toBe('いる');
    expect(verbForms(findVerb('要る')).negative.casual).toEqual(['いらない']);
    expect(verbForms(findVerb('湿る')).negative.casual).toEqual(['しめらない']);
    expect(verbForms(findVerb('閉める')).negative.casual).toEqual(['しめない']);
    expect(verbForms(findVerb('練る')).negative.casual).toEqual(['ねらない']);
    expect(verbForms(findVerb('寝る')).negative.casual).toEqual(['ねない']);
    expect(verbForms(findVerb('蹴る')).te.casual).toEqual(['けって']);
  });
});
