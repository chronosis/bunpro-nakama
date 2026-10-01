/// <reference types="vitest/globals" />
import { closestAcceptedAnswer, compareConjugation, toHiragana } from './conjugate';

describe('hiragana conjugation matching', () => {
  it('reads a kanji answer as the same hiragana stem the student typed', () => {
    expect(toHiragana('食べて')).toBe('たべて');
    expect(toHiragana('書いて')).toBe('かいて');
    expect(toHiragana('タベタ')).toBe('たべた');

    const compared = compareConjugation('たべた', ['食べて']);
    expect(compared).toMatchObject({
      lemma: '食べる',
      reading: 'たべる',
      stem: 'たべ',
      actualForm: 'ta',
      expectedForm: 'te',
    });
  });

  it('treats 行く te-form as って, not the regular く pattern', () => {
    expect(compareConjugation('行いて', ['行って'])).toMatchObject({
      lemma: '行く',
      stem: 'い',
      actualForm: 'te-mistaken',
      expectedForm: 'te',
    });
  });

  it('does not call it a conjugation miss when the hiragana forms already match', () => {
    expect(compareConjugation('たかかったです', ['高かったです'])).toBeNull();
  });

  it('compares the student answer with the closest accepted answer', () => {
    expect(closestAcceptedAnswer('むさく', ['ちがいます', 'ちがう'])).toBe('ちがう');
    expect(compareConjugation('たべた', ['食べます', '食べて'])).toMatchObject({
      lemma: '食べる',
      actualForm: 'ta',
      expectedForm: 'te',
    });
    expect(compareConjugation('たべた', ['食べて', '食べた'])).toBeNull();
  });
});
