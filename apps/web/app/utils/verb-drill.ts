import { applyRomaji } from './romaji-kana';

export type FormId =
  | 'dictionary'
  | 'negative'
  | 'te'
  | 'past'
  | 'pastNegative'
  | 'volitional'
  | 'progressive'
  | 'progressiveNegative'
  | 'desire'
  | 'desireNegative';

export type Politeness = 'casual' | 'polite';

export type WordClass = 'ichidan' | 'godan' | 'iku' | 'aru' | 'suru' | 'kuru';

export interface Verb {
  lemma: string;
  reading: string;
  wordClass: WordClass;
  meaning: string;
}

export interface FuriganaPart {
  text: string;
  reading?: string;
}

export const FORM_ROWS: readonly { id: FormId; label: string }[] = [
  { id: 'dictionary', label: 'Standard' },
  { id: 'negative', label: 'Standard negative' },
  { id: 'past', label: 'Past' },
  { id: 'pastNegative', label: 'Past negative' },
  { id: 'te', label: 'Te-form' },
  { id: 'volitional', label: 'Volitional' },
  { id: 'progressive', label: 'Progressive' },
  { id: 'progressiveNegative', label: 'Negative progressive' },
  { id: 'desire', label: 'Desire' },
  { id: 'desireNegative', label: 'Negative desire' },
];

const GODAN_ROWS: Record<string, [string, string, string, string, string]> = {
  う: ['わ', 'い', 'う', 'え', 'お'],
  く: ['か', 'き', 'く', 'け', 'こ'],
  ぐ: ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  す: ['さ', 'し', 'す', 'せ', 'そ'],
  つ: ['た', 'ち', 'つ', 'て', 'と'],
  ぬ: ['な', 'に', 'ぬ', 'ね', 'の'],
  ぶ: ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  む: ['ま', 'み', 'む', 'め', 'も'],
  る: ['ら', 'り', 'る', 'れ', 'ろ'],
};

const KANA = /[\u3041-\u3096\u30a1-\u30faー]/;

type AnswerCell = Record<Politeness, string[]>;
type AnswerGrid = Record<FormId, AnswerCell>;

function pair(casual: string[], polite: string[]): AnswerCell {
  return { casual, polite };
}

function one(value: string): string[] {
  return [value];
}

function teTaFor(last: string): { te: string; ta: string } {
  if (last === 'う' || last === 'つ' || last === 'る') return { te: 'って', ta: 'った' };
  if (last === 'く') return { te: 'いて', ta: 'いた' };
  if (last === 'ぐ') return { te: 'いで', ta: 'いだ' };
  if (last === 'す') return { te: 'して', ta: 'した' };
  return { te: 'んで', ta: 'んだ' };
}

function progressive(te: string): AnswerCell {
  const casual = [`${te}いる`];
  const polite = [`${te}います`];
  if (te.endsWith('て')) {
    casual.push(`${te.slice(0, -1)}てる`);
    polite.push(`${te.slice(0, -1)}てます`);
  } else if (te.endsWith('で')) {
    casual.push(`${te.slice(0, -1)}でる`);
    polite.push(`${te.slice(0, -1)}でます`);
  }
  return pair(casual, polite);
}

function negativeProgressive(te: string): AnswerCell {
  const casual = [`${te}いない`];
  const polite = [`${te}いません`];
  if (te.endsWith('て')) {
    casual.push(`${te.slice(0, -1)}てない`);
    polite.push(`${te.slice(0, -1)}てません`);
  } else if (te.endsWith('で')) {
    casual.push(`${te.slice(0, -1)}でない`);
    polite.push(`${te.slice(0, -1)}でません`);
  }
  return pair(casual, polite);
}

function negativeDesire(iStem: string): AnswerCell {
  return pair(one(`${iStem}たくない`), [`${iStem}たくないです`, `${iStem}たくありません`]);
}

function conjugateIchidan(reading: string): AnswerGrid {
  const stem = reading.slice(0, -1);
  const te = `${stem}て`;
  return {
    dictionary: pair(one(reading), one(`${stem}ます`)),
    negative: pair(one(`${stem}ない`), one(`${stem}ません`)),
    te: pair(one(te), one(`${stem}まして`)),
    past: pair(one(`${stem}た`), one(`${stem}ました`)),
    pastNegative: pair(one(`${stem}なかった`), one(`${stem}ませんでした`)),
    volitional: pair(one(`${stem}よう`), one(`${stem}ましょう`)),
    progressive: progressive(te),
    progressiveNegative: negativeProgressive(te),
    desire: pair(one(`${stem}たい`), one(`${stem}たいです`)),
    desireNegative: negativeDesire(stem),
  };
}

function conjugateGodan(reading: string, wordClass: 'godan' | 'iku' | 'aru'): AnswerGrid {
  const last = reading.slice(-1);
  const stem = reading.slice(0, -1);
  const row = GODAN_ROWS[last];
  if (!row) throw new Error(`Unsupported godan ending: ${reading}`);
  const [a, i, , , o] = row;
  const pattern = teTaFor(last);
  const te = `${stem}${wordClass === 'iku' ? 'って' : pattern.te}`;
  const ta = `${stem}${wordClass === 'iku' ? 'った' : pattern.ta}`;
  const iStem = `${stem}${i}`;
  const negative = wordClass === 'aru' ? 'ない' : `${stem}${a}ない`;
  const pastNegative = wordClass === 'aru' ? 'なかった' : `${stem}${a}なかった`;
  return {
    dictionary: pair(one(reading), one(`${iStem}ます`)),
    negative: pair(one(negative), one(`${iStem}ません`)),
    te: pair(one(te), one(`${iStem}まして`)),
    past: pair(one(ta), one(`${iStem}ました`)),
    pastNegative: pair(one(pastNegative), one(`${iStem}ませんでした`)),
    volitional: pair(one(`${stem}${o}う`), one(`${iStem}ましょう`)),
    progressive: progressive(te),
    progressiveNegative: negativeProgressive(te),
    desire: pair(one(`${iStem}たい`), one(`${iStem}たいです`)),
    desireNegative: negativeDesire(iStem),
  };
}

function conjugateSuru(): AnswerGrid {
  return {
    dictionary: pair(one('する'), one('します')),
    negative: pair(one('しない'), one('しません')),
    te: pair(one('して'), one('しまして')),
    past: pair(one('した'), one('しました')),
    pastNegative: pair(one('しなかった'), one('しませんでした')),
    volitional: pair(one('しよう'), one('しましょう')),
    progressive: progressive('して'),
    progressiveNegative: negativeProgressive('して'),
    desire: pair(one('したい'), one('したいです')),
    desireNegative: negativeDesire('し'),
  };
}

function conjugateKuru(): AnswerGrid {
  return {
    dictionary: pair(one('くる'), one('きます')),
    negative: pair(one('こない'), one('きません')),
    te: pair(one('きて'), one('きまして')),
    past: pair(one('きた'), one('きました')),
    pastNegative: pair(one('こなかった'), one('きませんでした')),
    volitional: pair(one('こよう'), one('きましょう')),
    progressive: progressive('きて'),
    progressiveNegative: negativeProgressive('きて'),
    desire: pair(one('きたい'), one('きたいです')),
    desireNegative: negativeDesire('き'),
  };
}

export function verbForms(verb: Verb): AnswerGrid {
  switch (verb.wordClass) {
    case 'ichidan':
      return conjugateIchidan(verb.reading);
    case 'godan':
    case 'iku':
    case 'aru':
      return conjugateGodan(verb.reading, verb.wordClass);
    case 'suru':
      return conjugateSuru();
    case 'kuru':
      return conjugateKuru();
  }
}

export function normalizeAnswer(value: string): string {
  return applyRomaji(value.replace(/\s+/g, ''));
}

export function answerMatches(input: string, accepted: readonly string[]): boolean {
  const normalized = normalizeAnswer(input);
  if (!normalized) return false;
  return accepted.some((answer) => normalizeAnswer(answer) === normalized);
}

export function furiganaParts(lemma: string, reading: string): FuriganaPart[] {
  let lemmaIndex = lemma.length;
  let readingIndex = reading.length;
  while (lemmaIndex > 0 && readingIndex > 0) {
    const lemmaChar = lemma[lemmaIndex - 1] ?? '';
    const readingChar = reading[readingIndex - 1] ?? '';
    if (!KANA.test(lemmaChar) || lemmaChar !== readingChar) break;
    lemmaIndex -= 1;
    readingIndex -= 1;
  }
  const kanji = lemma.slice(0, lemmaIndex);
  const okurigana = lemma.slice(lemmaIndex);
  if (!kanji) return [{ text: lemma }];
  const parts: FuriganaPart[] = [{ text: kanji, reading: reading.slice(0, readingIndex) }];
  if (okurigana) parts.push({ text: okurigana });
  return parts;
}

export function verbClassLabel(verb: Verb): string {
  if (verb.wordClass === 'ichidan') return 'Ichidan';
  if (verb.wordClass === 'godan' || verb.wordClass === 'iku') return 'Godan';
  return 'Irregular';
}

export function emptyAnswers(): Record<FormId, Record<Politeness, string>> {
  return {
    dictionary: { casual: '', polite: '' },
    negative: { casual: '', polite: '' },
    te: { casual: '', polite: '' },
    past: { casual: '', polite: '' },
    pastNegative: { casual: '', polite: '' },
    volitional: { casual: '', polite: '' },
    progressive: { casual: '', polite: '' },
    progressiveNegative: { casual: '', polite: '' },
    desire: { casual: '', polite: '' },
    desireNegative: { casual: '', polite: '' },
  };
}

export const VERBS: readonly Verb[] = [
  { lemma: 'する', reading: 'する', wordClass: 'suru', meaning: 'to do' },
  { lemma: '来る', reading: 'くる', wordClass: 'kuru', meaning: 'to come' },
  { lemma: 'ある', reading: 'ある', wordClass: 'aru', meaning: 'to exist' },
  { lemma: '行く', reading: 'いく', wordClass: 'iku', meaning: 'to go' },
  { lemma: '買う', reading: 'かう', wordClass: 'godan', meaning: 'to buy' },
  { lemma: '会う', reading: 'あう', wordClass: 'godan', meaning: 'to meet' },
  { lemma: '言う', reading: 'いう', wordClass: 'godan', meaning: 'to say' },
  { lemma: '思う', reading: 'おもう', wordClass: 'godan', meaning: 'to think' },
  { lemma: '歌う', reading: 'うたう', wordClass: 'godan', meaning: 'to sing' },
  { lemma: '使う', reading: 'つかう', wordClass: 'godan', meaning: 'to use' },
  { lemma: '洗う', reading: 'あらう', wordClass: 'godan', meaning: 'to wash' },
  { lemma: '習う', reading: 'ならう', wordClass: 'godan', meaning: 'to learn' },
  { lemma: '違う', reading: 'ちがう', wordClass: 'godan', meaning: 'to differ' },
  { lemma: '合う', reading: 'あう', wordClass: 'godan', meaning: 'to match' },
  { lemma: '書く', reading: 'かく', wordClass: 'godan', meaning: 'to write' },
  { lemma: '聞く', reading: 'きく', wordClass: 'godan', meaning: 'to hear' },
  { lemma: '歩く', reading: 'あるく', wordClass: 'godan', meaning: 'to walk' },
  { lemma: '引く', reading: 'ひく', wordClass: 'godan', meaning: 'to pull' },
  { lemma: '置く', reading: 'おく', wordClass: 'godan', meaning: 'to put' },
  { lemma: '働く', reading: 'はたらく', wordClass: 'godan', meaning: 'to work' },
  { lemma: '開く', reading: 'あく', wordClass: 'godan', meaning: 'to open' },
  { lemma: '着く', reading: 'つく', wordClass: 'godan', meaning: 'to arrive' },
  { lemma: '泣く', reading: 'なく', wordClass: 'godan', meaning: 'to cry' },
  { lemma: '泳ぐ', reading: 'およぐ', wordClass: 'godan', meaning: 'to swim' },
  { lemma: '急ぐ', reading: 'いそぐ', wordClass: 'godan', meaning: 'to hurry' },
  { lemma: '脱ぐ', reading: 'ぬぐ', wordClass: 'godan', meaning: 'to take off' },
  { lemma: '話す', reading: 'はなす', wordClass: 'godan', meaning: 'to speak' },
  { lemma: '出す', reading: 'だす', wordClass: 'godan', meaning: 'to take out' },
  { lemma: '返す', reading: 'かえす', wordClass: 'godan', meaning: 'to return' },
  { lemma: '貸す', reading: 'かす', wordClass: 'godan', meaning: 'to lend' },
  { lemma: '直す', reading: 'なおす', wordClass: 'godan', meaning: 'to fix' },
  { lemma: '押す', reading: 'おす', wordClass: 'godan', meaning: 'to push' },
  { lemma: '消す', reading: 'けす', wordClass: 'godan', meaning: 'to erase' },
  { lemma: '待つ', reading: 'まつ', wordClass: 'godan', meaning: 'to wait' },
  { lemma: '立つ', reading: 'たつ', wordClass: 'godan', meaning: 'to stand' },
  { lemma: '持つ', reading: 'もつ', wordClass: 'godan', meaning: 'to hold' },
  { lemma: '打つ', reading: 'うつ', wordClass: 'godan', meaning: 'to hit' },
  { lemma: '死ぬ', reading: 'しぬ', wordClass: 'godan', meaning: 'to die' },
  { lemma: '遊ぶ', reading: 'あそぶ', wordClass: 'godan', meaning: 'to play' },
  { lemma: '飛ぶ', reading: 'とぶ', wordClass: 'godan', meaning: 'to fly' },
  { lemma: '呼ぶ', reading: 'よぶ', wordClass: 'godan', meaning: 'to call' },
  { lemma: '選ぶ', reading: 'えらぶ', wordClass: 'godan', meaning: 'to choose' },
  { lemma: '並ぶ', reading: 'ならぶ', wordClass: 'godan', meaning: 'to line up' },
  { lemma: '読む', reading: 'よむ', wordClass: 'godan', meaning: 'to read' },
  { lemma: '飲む', reading: 'のむ', wordClass: 'godan', meaning: 'to drink' },
  { lemma: '休む', reading: 'やすむ', wordClass: 'godan', meaning: 'to rest' },
  { lemma: '住む', reading: 'すむ', wordClass: 'godan', meaning: 'to live in' },
  { lemma: '頼む', reading: 'たのむ', wordClass: 'godan', meaning: 'to request' },
  { lemma: '取る', reading: 'とる', wordClass: 'godan', meaning: 'to take' },
  { lemma: '知る', reading: 'しる', wordClass: 'godan', meaning: 'to know' },
  { lemma: '切る', reading: 'きる', wordClass: 'godan', meaning: 'to cut' },
  { lemma: '走る', reading: 'はしる', wordClass: 'godan', meaning: 'to run' },
  { lemma: '帰る', reading: 'かえる', wordClass: 'godan', meaning: 'to go home' },
  { lemma: '入る', reading: 'はいる', wordClass: 'godan', meaning: 'to enter' },
  { lemma: '乗る', reading: 'のる', wordClass: 'godan', meaning: 'to ride' },
  { lemma: '作る', reading: 'つくる', wordClass: 'godan', meaning: 'to make' },
  { lemma: '座る', reading: 'すわる', wordClass: 'godan', meaning: 'to sit' },
  { lemma: '終わる', reading: 'おわる', wordClass: 'godan', meaning: 'to end' },
  { lemma: '始まる', reading: 'はじまる', wordClass: 'godan', meaning: 'to begin' },
  { lemma: '送る', reading: 'おくる', wordClass: 'godan', meaning: 'to send' },
  { lemma: '降る', reading: 'ふる', wordClass: 'godan', meaning: 'to fall' },
  { lemma: '分かる', reading: 'わかる', wordClass: 'godan', meaning: 'to understand' },
  { lemma: '登る', reading: 'のぼる', wordClass: 'godan', meaning: 'to climb' },
  { lemma: '戻る', reading: 'もどる', wordClass: 'godan', meaning: 'to return' },
  { lemma: '要る', reading: 'いる', wordClass: 'godan', meaning: 'to need' },
  { lemma: '煎る', reading: 'いる', wordClass: 'godan', meaning: 'to roast' },
  { lemma: '減る', reading: 'へる', wordClass: 'godan', meaning: 'to decrease' },
  { lemma: '焦る', reading: 'あせる', wordClass: 'godan', meaning: 'to panic' },
  { lemma: '滑る', reading: 'すべる', wordClass: 'godan', meaning: 'to slip' },
  { lemma: '限る', reading: 'かぎる', wordClass: 'godan', meaning: 'to limit' },
  { lemma: '握る', reading: 'にぎる', wordClass: 'godan', meaning: 'to grip' },
  { lemma: '練る', reading: 'ねる', wordClass: 'godan', meaning: 'to knead' },
  { lemma: '混じる', reading: 'まじる', wordClass: 'godan', meaning: 'to be mixed' },
  { lemma: '交じる', reading: 'まじる', wordClass: 'godan', meaning: 'to mingle' },
  { lemma: '喋る', reading: 'しゃべる', wordClass: 'godan', meaning: 'to chat' },
  { lemma: '湿る', reading: 'しめる', wordClass: 'godan', meaning: 'to get damp' },
  { lemma: '散る', reading: 'ちる', wordClass: 'godan', meaning: 'to scatter' },
  { lemma: '照る', reading: 'てる', wordClass: 'godan', meaning: 'to shine' },
  { lemma: '参る', reading: 'まいる', wordClass: 'godan', meaning: 'to go (humble)' },
  { lemma: '蹴る', reading: 'ける', wordClass: 'godan', meaning: 'to kick' },
  { lemma: '罵る', reading: 'ののしる', wordClass: 'godan', meaning: 'to insult' },
  { lemma: '弄る', reading: 'いじる', wordClass: 'godan', meaning: 'to fiddle with' },
  { lemma: '捻る', reading: 'ひねる', wordClass: 'godan', meaning: 'to twist' },
  { lemma: '茂る', reading: 'しげる', wordClass: 'godan', meaning: 'to grow thick' },
  { lemma: '遮る', reading: 'さえぎる', wordClass: 'godan', meaning: 'to block' },
  { lemma: '嘲る', reading: 'あざける', wordClass: 'godan', meaning: 'to ridicule' },
  { lemma: '齧る', reading: 'かじる', wordClass: 'godan', meaning: 'to gnaw' },
  { lemma: '返る', reading: 'かえる', wordClass: 'godan', meaning: 'to come back' },
  { lemma: '翻る', reading: 'ひるがえる', wordClass: 'godan', meaning: 'to flutter' },
  { lemma: '食べる', reading: 'たべる', wordClass: 'ichidan', meaning: 'to eat' },
  { lemma: '見る', reading: 'みる', wordClass: 'ichidan', meaning: 'to see' },
  { lemma: '起きる', reading: 'おきる', wordClass: 'ichidan', meaning: 'to get up' },
  { lemma: '寝る', reading: 'ねる', wordClass: 'ichidan', meaning: 'to sleep' },
  { lemma: '着る', reading: 'きる', wordClass: 'ichidan', meaning: 'to wear' },
  { lemma: '出る', reading: 'でる', wordClass: 'ichidan', meaning: 'to go out' },
  { lemma: '開ける', reading: 'あける', wordClass: 'ichidan', meaning: 'to open' },
  { lemma: '閉める', reading: 'しめる', wordClass: 'ichidan', meaning: 'to close' },
  { lemma: '教える', reading: 'おしえる', wordClass: 'ichidan', meaning: 'to teach' },
  { lemma: '覚える', reading: 'おぼえる', wordClass: 'ichidan', meaning: 'to remember' },
  { lemma: '忘れる', reading: 'わすれる', wordClass: 'ichidan', meaning: 'to forget' },
  { lemma: '考える', reading: 'かんがえる', wordClass: 'ichidan', meaning: 'to think about' },
  { lemma: '答える', reading: 'こたえる', wordClass: 'ichidan', meaning: 'to answer' },
  { lemma: '変える', reading: 'かえる', wordClass: 'ichidan', meaning: 'to change' },
  { lemma: '決める', reading: 'きめる', wordClass: 'ichidan', meaning: 'to decide' },
  { lemma: '生きる', reading: 'いきる', wordClass: 'ichidan', meaning: 'to live' },
  { lemma: '信じる', reading: 'しんじる', wordClass: 'ichidan', meaning: 'to believe' },
  { lemma: '続ける', reading: 'つづける', wordClass: 'ichidan', meaning: 'to continue' },
  { lemma: '見せる', reading: 'みせる', wordClass: 'ichidan', meaning: 'to show' },
  { lemma: 'できる', reading: 'できる', wordClass: 'ichidan', meaning: 'to be able to' },
  { lemma: '入れる', reading: 'いれる', wordClass: 'ichidan', meaning: 'to put in' },
  { lemma: '調べる', reading: 'しらべる', wordClass: 'ichidan', meaning: 'to look up' },
  { lemma: '伝える', reading: 'つたえる', wordClass: 'ichidan', meaning: 'to convey' },
  { lemma: '受ける', reading: 'うける', wordClass: 'ichidan', meaning: 'to receive' },
  { lemma: '助ける', reading: 'たすける', wordClass: 'ichidan', meaning: 'to help' },
  { lemma: '比べる', reading: 'くらべる', wordClass: 'ichidan', meaning: 'to compare' },
  { lemma: '集める', reading: 'あつめる', wordClass: 'ichidan', meaning: 'to collect' },
  { lemma: '止める', reading: 'とめる', wordClass: 'ichidan', meaning: 'to stop' },
  { lemma: '始める', reading: 'はじめる', wordClass: 'ichidan', meaning: 'to start' },
  { lemma: '見つける', reading: 'みつける', wordClass: 'ichidan', meaning: 'to find' },
  { lemma: '疲れる', reading: 'つかれる', wordClass: 'ichidan', meaning: 'to get tired' },
];
