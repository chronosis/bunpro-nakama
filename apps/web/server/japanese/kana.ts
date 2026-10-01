const ROWS: Record<string, [string, string, string, string, string]> = {
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

const TE_TA: Record<string, { te: string; ta: string }> = {
  う: { te: 'って', ta: 'った' },
  つ: { te: 'って', ta: 'った' },
  る: { te: 'って', ta: 'った' },
  く: { te: 'いて', ta: 'いた' },
  ぐ: { te: 'いで', ta: 'いだ' },
  す: { te: 'して', ta: 'した' },
  ぬ: { te: 'んで', ta: 'んだ' },
  ぶ: { te: 'んで', ta: 'んだ' },
  む: { te: 'んで', ta: 'んだ' },
};

const EI = new Set([
  'い', 'き', 'ぎ', 'し', 'じ', 'ち', 'ぢ', 'に', 'ひ', 'び', 'ぴ', 'み', 'り',
  'え', 'け', 'げ', 'せ', 'ぜ', 'て', 'で', 'ね', 'へ', 'べ', 'ぺ', 'め', 'れ',
]);

export function godanRow(finalKana: string): [string, string, string, string, string] | null {
  return ROWS[finalKana] ?? null;
}

export function godanTeTa(finalKana: string): { te: string; ta: string } | null {
  return TE_TA[finalKana] ?? null;
}

export function endsWithEi(value: string): boolean {
  const last = value.at(-1);
  return last !== undefined && EI.has(last);
}

export function isKanaOrKanji(value: string): boolean {
  return /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u.test(value);
}
