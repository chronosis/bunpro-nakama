export interface BadTranslation {
  id: string;
  question: string;
  translation: string;
  alternative: string;
  nuance: string | null;
  createdAt: string;
}

export const BAD_TRANSLATION_KEY = 'nakama.bad-translations.v1';

export const JULY_FOLLOWING: BadTranslation = {
  id: 'seed:july-following',
  question: '７月の___は８月だ。',
  translation: 'After July comes August.',
  alternative: "July's **following** (month) is August",
  nuance: null,
  createdAt: '2026-10-05T00:00:00.000Z',
};

const SRS_NAME = String.raw`ghost|apprentice|guru|master|enlightened|burned|adept|seasoned|expert|veteran|beginner|novice`;
const SRS_TEXT = new RegExp(`^(?:${SRS_NAME})(?:\\s+(?:\\d+|[ivx]+))?$`, 'i');

export function resolveStored(raw: unknown): BadTranslation[] {
  if (raw === undefined) return [{ ...JULY_FOLLOWING }];
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = parseItem(item);
    return parsed ? [parsed] : [];
  });
}

export function normalizeQuestion(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/_{2,}/g, '___')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTranslation(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function findBadTranslation(
  items: readonly BadTranslation[],
  question: string,
  translation: string,
): BadTranslation | null {
  const wantedQuestion = normalizeQuestion(question);
  const wantedTranslation = normalizeTranslation(translation);
  return (
    items.find(
      (item) =>
        normalizeQuestion(item.question) === wantedQuestion &&
        normalizeTranslation(item.translation) === wantedTranslation,
    ) ?? null
  );
}

export function upsertBadTranslation(
  items: readonly BadTranslation[],
  draft: {
    question: string;
    translation: string;
    alternative: string;
    nuance?: string | null;
    now: string;
    id?: string;
  },
): BadTranslation[] {
  const alternative = draft.alternative.trim();
  const existing = findBadTranslation(items, draft.question, draft.translation);
  if (existing) {
    return items.map((item) =>
      item.id === existing.id
        ? { ...item, alternative, nuance: draft.nuance ?? item.nuance }
        : item,
    );
  }
  return [
    ...items,
    {
      id: draft.id ?? crypto.randomUUID(),
      question: draft.question.trim(),
      translation: draft.translation.trim(),
      alternative,
      nuance: draft.nuance ?? null,
      createdAt: draft.now,
    },
  ];
}

export function removeBadTranslation(items: readonly BadTranslation[], id: string): BadTranslation[] {
  return items.filter((item) => item.id !== id);
}

export function appendFormatted(parent: HTMLElement, source: string, doc: Document): void {
  const parts = source.split('**');
  parts.forEach((part, index) => {
    if (!part) return;
    if (index % 2 === 1) {
      const strong = doc.createElement('strong');
      strong.textContent = part;
      parent.append(strong);
      return;
    }
    parent.append(doc.createTextNode(part));
  });
}

export function isSrsLabel(value: string): boolean {
  const text = value.replace(/\s+/g, ' ').trim();
  if (SRS_TEXT.test(text)) return true;
  if (/srs progress/i.test(text)) return true;
  return /srs/i.test(text) && new RegExp(SRS_NAME, 'i').test(text);
}

function parseItem(value: unknown): BadTranslation | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== 'string' ||
    typeof item.question !== 'string' ||
    typeof item.translation !== 'string' ||
    typeof item.alternative !== 'string'
  ) {
    return null;
  }
  return {
    id: item.id,
    question: item.question,
    translation: item.translation,
    alternative: item.alternative,
    nuance: typeof item.nuance === 'string' ? item.nuance : null,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : JULY_FOLLOWING.createdAt,
  };
}
