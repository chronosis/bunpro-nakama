import { godanRow, godanTeTa } from './kana';
import { LEXICON, type Lexeme } from './lexicon';
import type { WordClass } from './types';

export interface ConjugationHit {
  lemma: string;
  reading: string;
  stem: string;
  wordClass: WordClass;
  form: string;
  surface: string;
}

interface IndexedSurface extends ConjugationHit {
  readingSurface: string;
}

const MIN_SURFACE = 2;

let cached: IndexedSurface[] | null = null;

export function katakanaToHiragana(value: string): string {
  return value.replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

export function conjugationHits(text: string): ConjugationHit[] {
  const normalized = katakanaToHiragana(text);
  const surfaces = allSurfaces();
  const hits: ConjugationHit[] = [];
  let index = 0;
  while (index < normalized.length) {
    const found = surfaces.filter((item) => normalized.startsWith(item.surface, index));
    if (found.length === 0) {
      index += 1;
      continue;
    }
    const length = Math.max(...found.map((item) => item.surface.length));
    const seen = new Set<string>();
    for (const item of found) {
      if (item.surface.length !== length) continue;
      const key = `${item.lemma}:${item.form}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        lemma: item.lemma,
        reading: item.reading,
        stem: item.stem,
        wordClass: item.wordClass,
        form: item.form,
        surface: item.surface,
      });
    }
    index += length;
  }
  return hits;
}

/** Replace recognized kanji conjugations with their hiragana reading. Katakana is folded too. */
export function toHiragana(text: string): string {
  const normalized = katakanaToHiragana(text);
  const surfaces = allSurfaces();
  let result = '';
  let index = 0;
  while (index < normalized.length) {
    const found = surfaces.filter((item) => normalized.startsWith(item.surface, index));
    if (found.length === 0) {
      result += normalized[index] ?? '';
      index += 1;
      continue;
    }
    const match = found.reduce((best, item) => (item.surface.length > best.surface.length ? item : best));
    result += match.readingSurface;
    index += match.surface.length;
  }
  return result;
}

export interface StemComparison {
  lemma: string;
  reading: string;
  stem: string;
  actualForm: string;
  expectedForm: string;
}

/** The accepted answer nearest to what the student typed, read in hiragana. */
export function closestAcceptedAnswer(userAnswer: string, acceptedAnswers: string[]): string | null {
  const candidates = acceptedAnswers.map((answer) => answer.trim()).filter(Boolean);
  const first = candidates[0];
  if (!first) return null;
  const user = normalizeAnswer(userAnswer);
  let best = first;
  let bestDistance = levenshtein(user, normalizeAnswer(first));
  for (const candidate of candidates.slice(1)) {
    const distance = levenshtein(user, normalizeAnswer(candidate));
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Same dictionary word, different conjugation, after the student answer and the
 * closest accepted answer are read as hiragana.
 * Returns null when those conjugations match or no shared word stem is found.
 */
export function compareConjugation(userAnswer: string, acceptedAnswers: string[]): StemComparison | null {
  const closest = closestAcceptedAnswer(userAnswer, acceptedAnswers);
  if (!closest) return null;
  const userHits = conjugationHits(userAnswer);
  const acceptedHits = conjugationHits(closest);
  const pairs = userHits.flatMap((user) =>
    acceptedHits
      .filter((accepted) => accepted.lemma === user.lemma)
      .map((accepted) => ({ user, accepted })),
  );
  if (pairs.length === 0) return null;
  if (pairs.some((pair) => pair.user.form === pair.accepted.form)) return null;
  const match = pairs[0];
  if (!match) return null;
  return {
    lemma: match.user.lemma,
    reading: match.user.reading,
    stem: match.user.stem,
    actualForm: match.user.form,
    expectedForm: match.accepted.form,
  };
}

function normalizeAnswer(value: string): string {
  return toHiragana(value).normalize('NFKC').replace(/\s+/g, '');
}

function levenshtein(left: string, right: string): number {
  const a = Array.from(left);
  const b = Array.from(right);
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    const leftChar = a[i - 1];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = leftChar === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1]! + 1, previous[j]! + 1, previous[j - 1]! + cost);
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j]!;
  }
  return previous[b.length] ?? 0;
}

function allSurfaces(): IndexedSurface[] {
  if (cached) return cached;
  const surfaces: IndexedSurface[] = [];
  for (const lexeme of LEXICON) {
    for (const form of formsFor(lexeme)) {
      pushSurface(surfaces, lexeme, form.stem, form.form, form.kanji, form.kana);
    }
  }
  cached = surfaces;
  return surfaces;
}

interface BuiltForm {
  stem: string;
  form: string;
  kanji: string;
  kana: string;
}

function formsFor(lexeme: Lexeme): BuiltForm[] {
  switch (lexeme.wordClass) {
    case 'ichidan':
      return ichidanForms(lexeme);
    case 'godan':
    case 'iku':
    case 'aru':
      return godanForms(lexeme);
    case 'suru':
      return suruForms(lexeme);
    case 'kuru':
      return kuruForms(lexeme);
    case 'i-adjective':
      return iAdjectiveForms(lexeme);
    case 'na-adjective':
      return naAdjectiveForms(lexeme);
    default:
      return [];
  }
}

function ichidanForms(lexeme: Lexeme): BuiltForm[] {
  const stem = lexeme.reading.slice(0, -1);
  const kanjiStem = lexeme.lemma.endsWith('る') ? lexeme.lemma.slice(0, -1) : lexeme.lemma;
  return [
    form(stem, 'dictionary', kanjiStem, stem, 'る'),
    form(stem, 'masu', kanjiStem, stem, 'ます'),
    form(stem, 'masen', kanjiStem, stem, 'ません'),
    form(stem, 'mashita', kanjiStem, stem, 'ました'),
    form(stem, 'te', kanjiStem, stem, 'て'),
    form(stem, 'ta', kanjiStem, stem, 'た'),
    form(stem, 'nai', kanjiStem, stem, 'ない'),
    form(stem, 'nakatta', kanjiStem, stem, 'なかった'),
    form(stem, 'ba', kanjiStem, stem, 'れば'),
    form(stem, 'volitional', kanjiStem, stem, 'よう'),
    form(stem, 'imperative', kanjiStem, stem, 'ろ'),
    form(stem, 'te-mistaken', kanjiStem, stem, 'って'),
    form(stem, 'ta-mistaken', kanjiStem, stem, 'った'),
    form(stem, 'nai-mistaken', kanjiStem, stem, 'らない'),
  ];
}

function godanForms(lexeme: Lexeme): BuiltForm[] {
  const finalKana = lexeme.reading.slice(-1);
  const row = godanRow(finalKana);
  const teTa = godanTeTa(finalKana);
  if (!row || !teTa) return [];
  const [a, i, u, e, o] = row;
  const stem = lexeme.reading.slice(0, -1);
  const kanjiStem = lexeme.lemma.endsWith(finalKana) ? lexeme.lemma.slice(0, -1) : lexeme.lemma;
  const irregularTe = lexeme.wordClass === 'iku';
  const forms: BuiltForm[] = [
    form(stem, 'dictionary', kanjiStem, stem, u),
    form(stem, 'masu', kanjiStem, stem, `${i}ます`),
    form(stem, 'masen', kanjiStem, stem, `${i}ません`),
    form(stem, 'mashita', kanjiStem, stem, `${i}ました`),
    form(stem, 'te', kanjiStem, stem, irregularTe ? 'って' : teTa.te),
    form(stem, 'ta', kanjiStem, stem, irregularTe ? 'った' : teTa.ta),
    form(stem, 'ba', kanjiStem, stem, `${e}ば`),
    form(stem, 'volitional', kanjiStem, stem, `${o}う`),
    form(stem, 'imperative', kanjiStem, stem, e),
  ];
  if (lexeme.wordClass === 'aru') {
    forms.push(form(stem, 'nai', '', '', 'ない'), form(stem, 'nakatta', '', '', 'なかった'));
  } else {
    forms.push(
      form(stem, 'nai', kanjiStem, stem, `${a}ない`),
      form(stem, 'nakatta', kanjiStem, stem, `${a}なかった`),
    );
  }
  if (irregularTe) {
    forms.push(form(stem, 'te-mistaken', kanjiStem, stem, 'いて'), form(stem, 'ta-mistaken', kanjiStem, stem, 'いた'));
  }
  return forms;
}

function suruForms(_lexeme: Lexeme): BuiltForm[] {
  return [
    ['dictionary', 'する'],
    ['masu', 'します'],
    ['masen', 'しません'],
    ['mashita', 'しました'],
    ['te', 'して'],
    ['ta', 'した'],
    ['nai', 'しない'],
    ['nakatta', 'しなかった'],
    ['ba', 'すれば'],
    ['volitional', 'しよう'],
  ].map(([formName, surface]) => ({ stem: 'し', form: formName ?? 'dictionary', kanji: surface ?? '', kana: surface ?? '' }));
}

function kuruForms(lexeme: Lexeme): BuiltForm[] {
  return [
    form('き', 'dictionary', '来', 'く', 'る'),
    form('き', 'masu', '来', 'き', 'ます'),
    form('き', 'masen', '来', 'き', 'ません'),
    form('き', 'mashita', '来', 'き', 'ました'),
    form('き', 'te', '来', 'き', 'て'),
    form('き', 'ta', '来', 'き', 'た'),
    form('き', 'nai', '来', 'こ', 'ない'),
    form('き', 'nakatta', '来', 'こ', 'なかった'),
    form('き', 'volitional', '来', 'こ', 'よう'),
  ];
}

function iAdjectiveForms(lexeme: Lexeme): BuiltForm[] {
  if (lexeme.reading === 'いい') {
    return [
      form('よ', 'dictionary', 'いい', 'いい', ''),
      form('よ', 'polite', 'いい', 'いい', 'です'),
      form('よ', 'past', 'よ', 'よ', 'かった'),
      form('よ', 'past-polite', 'よ', 'よ', 'かったです'),
      form('よ', 'negative', 'よ', 'よ', 'くない'),
      form('よ', 'te', 'よ', 'よ', 'くて'),
    ];
  }
  const stem = lexeme.reading.slice(0, -1);
  const kanjiStem = lexeme.lemma.endsWith('い') ? lexeme.lemma.slice(0, -1) : lexeme.lemma;
  return [
    form(stem, 'dictionary', kanjiStem, stem, 'い'),
    form(stem, 'polite', kanjiStem, stem, 'いです'),
    form(stem, 'past', kanjiStem, stem, 'かった'),
    form(stem, 'past-polite', kanjiStem, stem, 'かったです'),
    form(stem, 'negative', kanjiStem, stem, 'くない'),
    form(stem, 'past-negative', kanjiStem, stem, 'くなかった'),
    form(stem, 'te', kanjiStem, stem, 'くて'),
    form(stem, 'ba', kanjiStem, stem, 'ければ'),
  ];
}

function naAdjectiveForms(lexeme: Lexeme): BuiltForm[] {
  const stem = lexeme.reading;
  return [
    form(stem, 'dictionary', lexeme.lemma, lexeme.reading, ''),
    form(stem, 'polite', lexeme.lemma, lexeme.reading, 'です'),
    form(stem, 'past', lexeme.lemma, lexeme.reading, 'だった'),
    form(stem, 'negative', lexeme.lemma, lexeme.reading, 'じゃない'),
    form(stem, 'adverbial', lexeme.lemma, lexeme.reading, 'に'),
  ];
}

function form(stem: string, formName: string, kanjiStem: string, kanaStem: string, suffix: string): BuiltForm {
  return {
    stem,
    form: formName,
    kanji: `${kanjiStem}${suffix}`,
    kana: `${kanaStem}${suffix}`,
  };
}

function pushSurface(
  surfaces: IndexedSurface[],
  lexeme: Lexeme,
  stem: string,
  formName: string,
  kanji: string,
  kana: string,
): void {
  const base = {
    lemma: lexeme.lemma,
    reading: lexeme.reading,
    stem,
    wordClass: lexeme.wordClass,
    form: formName,
    readingSurface: kana,
  };
  if (kana.length >= MIN_SURFACE) {
    surfaces.push({ ...base, surface: kana });
  }
  if (kanji !== kana && kanji.length >= MIN_SURFACE) {
    surfaces.push({ ...base, surface: kanji });
  }
}
