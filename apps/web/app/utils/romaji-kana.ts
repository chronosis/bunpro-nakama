const SYLLABLES: Record<string, string> = {
  a: 'あ',
  i: 'い',
  u: 'う',
  e: 'え',
  o: 'お',
  ka: 'か',
  ki: 'き',
  ku: 'く',
  ke: 'け',
  ko: 'こ',
  ga: 'が',
  gi: 'ぎ',
  gu: 'ぐ',
  ge: 'げ',
  go: 'ご',
  sa: 'さ',
  si: 'し',
  shi: 'し',
  su: 'す',
  se: 'せ',
  so: 'そ',
  za: 'ざ',
  zi: 'じ',
  ji: 'じ',
  zu: 'ず',
  ze: 'ぜ',
  zo: 'ぞ',
  ta: 'た',
  ti: 'ち',
  chi: 'ち',
  tu: 'つ',
  tsu: 'つ',
  te: 'て',
  to: 'と',
  da: 'だ',
  di: 'ぢ',
  du: 'づ',
  de: 'で',
  do: 'ど',
  na: 'な',
  ni: 'に',
  nu: 'ぬ',
  ne: 'ね',
  no: 'の',
  ha: 'は',
  hi: 'ひ',
  hu: 'ふ',
  fu: 'ふ',
  he: 'へ',
  ho: 'ほ',
  ba: 'ば',
  bi: 'び',
  bu: 'ぶ',
  be: 'べ',
  bo: 'ぼ',
  pa: 'ぱ',
  pi: 'ぴ',
  pu: 'ぷ',
  pe: 'ぺ',
  po: 'ぽ',
  ma: 'ま',
  mi: 'み',
  mu: 'む',
  me: 'め',
  mo: 'も',
  ya: 'や',
  yu: 'ゆ',
  yo: 'よ',
  ra: 'ら',
  ri: 'り',
  ru: 'る',
  re: 'れ',
  ro: 'ろ',
  wa: 'わ',
  wo: 'を',
  xa: 'ぁ',
  xi: 'ぃ',
  xu: 'ぅ',
  xe: 'ぇ',
  xo: 'ぉ',
  la: 'ぁ',
  li: 'ぃ',
  lu: 'ぅ',
  le: 'ぇ',
  lo: 'ぉ',
  xtu: 'っ',
  xtsu: 'っ',
  ltu: 'っ',
  ltsu: 'っ',
  kya: 'きゃ',
  kyu: 'きゅ',
  kyo: 'きょ',
  gya: 'ぎゃ',
  gyu: 'ぎゅ',
  gyo: 'ぎょ',
  sha: 'しゃ',
  shu: 'しゅ',
  sho: 'しょ',
  sya: 'しゃ',
  syu: 'しゅ',
  syo: 'しょ',
  ja: 'じゃ',
  ju: 'じゅ',
  jo: 'じょ',
  jya: 'じゃ',
  jyu: 'じゅ',
  jyo: 'じょ',
  zya: 'じゃ',
  zyu: 'じゅ',
  zyo: 'じょ',
  cha: 'ちゃ',
  chu: 'ちゅ',
  cho: 'ちょ',
  tya: 'ちゃ',
  tyu: 'ちゅ',
  tyo: 'ちょ',
  nya: 'にゃ',
  nyu: 'にゅ',
  nyo: 'にょ',
  hya: 'ひゃ',
  hyu: 'ひゅ',
  hyo: 'ひょ',
  bya: 'びゃ',
  byu: 'びゅ',
  byo: 'びょ',
  pya: 'ぴゃ',
  pyu: 'ぴゅ',
  pyo: 'ぴょ',
  mya: 'みゃ',
  myu: 'みゅ',
  myo: 'みょ',
  rya: 'りゃ',
  ryu: 'りゅ',
  ryo: 'りょ',
};

const PREFIXES = new Set<string>();
for (const key of Object.keys(SYLLABLES)) {
  for (let length = 1; length < key.length; length += 1) {
    PREFIXES.add(key.slice(0, length));
  }
}

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);

function isLatinLetter(char: string): boolean {
  return char >= 'a' && char <= 'z';
}

function isConsonant(char: string): boolean {
  return isLatinLetter(char) && !VOWELS.has(char);
}

function foldKatakana(value: string): string {
  let folded = '';
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code !== undefined && code >= 0x30a1 && code <= 0x30f6) {
      folded += String.fromCodePoint(code - 0x60);
    } else {
      folded += char;
    }
  }
  return folded;
}

function matchSyllable(input: string, index: number): { kana: string; length: number } | null {
  const max = Math.min(4, input.length - index);
  for (let length = max; length >= 1; length -= 1) {
    const kana = SYLLABLES[input.slice(index, index + length)];
    if (kana) return { kana, length };
  }
  return null;
}

function pendingLength(input: string, index: number): number {
  let length = 0;
  const limit = input.length - index;
  for (let size = 1; size <= limit; size += 1) {
    if (!PREFIXES.has(input.slice(index, index + size))) break;
    length = size;
  }
  return length;
}

/** Lowercase latin, fold katakana, and convert completed romaji syllables. */
export function applyRomaji(value: string): string {
  const input = foldKatakana(value.toLowerCase());
  let result = '';
  let index = 0;
  while (index < input.length) {
    const char = input[index] ?? '';
    if (!isLatinLetter(char)) {
      result += char;
      index += 1;
      continue;
    }
    const next = input[index + 1];
    if (isConsonant(char) && char !== 'n' && next === char) {
      result += 'っ';
      index += 1;
      continue;
    }
    const syllable = matchSyllable(input, index);
    if (syllable) {
      result += syllable.kana;
      index += syllable.length;
      continue;
    }
    if (char === 'n') {
      if (next === "'") {
        result += 'ん';
        index += 2;
        continue;
      }
      if (next === 'n') {
        const third = input[index + 2];
        if (third && (VOWELS.has(third) || third === 'y')) {
          result += 'ん';
          index += 1;
          continue;
        }
        result += 'ん';
        index += 2;
        continue;
      }
      if (next && isConsonant(next) && next !== 'y') {
        result += 'ん';
        index += 1;
        continue;
      }
    }
    const pending = pendingLength(input, index);
    if (pending > 0 && index + pending === input.length) {
      result += input.slice(index);
      break;
    }
    result += char;
    index += 1;
  }
  return result;
}
