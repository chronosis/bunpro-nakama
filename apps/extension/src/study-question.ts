import { emphasizeSpans } from '@bunpro-nakama/session-history';

export interface CapturedStudy {
  grammarTitle: string | null;
  lessonId: string | null;
  lessonLabel: string | null;
  partOfSpeech: string | null;
  wordType: string | null;
  word: string | null;
  traits: string[];
  helpPrompt: string | null;
}

interface FiberLike {
  return: FiberLike | null;
  child: FiberLike | null;
  sibling: FiberLike | null;
  memoizedProps?: { question?: unknown } | null;
}

const CLASS_TAGS = new Set([
  'verb',
  'adjective',
  'noun',
  'expression',
  'adverb',
  'particle',
  'irregular',
  'godan',
  'ichidan',
  'i-adjective',
  'na-adjective',
  'suru verb',
  'intransitive',
  'transitive',
]);

export function questionFromFiber(start: FiberLike | null): unknown | null {
  let node = unwrap(start);
  for (let depth = 0; depth < 16 && node; depth += 1) {
    let child = unwrap(node.child);
    for (let index = 0; index < 20 && child; index += 1) {
      const question = child.memoizedProps?.question;
      if (hasReviewable(question)) return question;
      child = unwrap(child.sibling);
    }
    node = unwrap(node.return);
  }
  return null;
}

export function captureStudyQuestion(question: unknown): CapturedStudy | null {
  if (!hasReviewable(question)) return null;
  const reviewable = question.reviewable;
  const sentence = isRecord(question.sentence) ? question.sentence : null;
  const lessonId = text(reviewable.lesson_id);
  const lessonCount = text(reviewable.lesson_count);
  const title = text(reviewable.title);

  return {
    grammarTitle: title,
    lessonId,
    lessonLabel: lessonLabel(lessonId, lessonCount),
    partOfSpeech: text(reviewable.part_of_speech_translation) || text(reviewable.part_of_speech),
    wordType: text(reviewable.word_type_translation) || text(reviewable.word_type),
    word: exampleWord(text(sentence?.content)),
    traits: traitsFromMetadata(text(reviewable.metadata)),
    helpPrompt: text(sentence?.tense),
  };
}

export function readPageStudyQuestion(root: ParentNode): CapturedStudy | null {
  try {
    const quiz = root.querySelector('#js-quiz');
    if (!quiz) return null;
    const record = unwrap(quiz) as unknown as Record<string, FiberLike | null>;
    const fiberKey = Object.keys(record).find((name) => name.startsWith('__reactFiber'));
    if (!fiberKey) return null;
    const question = questionFromFiber(record[fiberKey] ?? null);
    return question ? captureStudyQuestion(question) : null;
  } catch {
    return null;
  }
}

function unwrap<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;
  const wrapped = (value as { wrappedJSObject?: T }).wrappedJSObject;
  return wrapped && typeof wrapped === 'object' ? wrapped : value;
}

function lessonLabel(lessonId: string | null, lessonCount: string | null): string | null {
  if (lessonId && lessonCount) return `Lesson ${lessonId} (${lessonCount})`;
  if (lessonId) return `Lesson ${lessonId}`;
  return lessonCount;
}

export function exampleWord(content: string | null): string | null {
  if (!content) return null;
  const parts = emphasizeSpans(content)
    .replace(/_+/g, ' ')
    .split(/[。、！？!?,.・\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function traitsFromMetadata(metadata: string | null): string[] {
  if (!metadata) return [];
  const traits: string[] = [];
  for (const token of metadata.split(',')) {
    const value = token.trim().toLowerCase();
    if (!/^[a-z][a-z -]*$/.test(value)) continue;
    if (value.includes(' ') || CLASS_TAGS.has(value)) traits.push(value);
  }
  return [...new Set(traits)];
}

function hasReviewable(value: unknown): value is { reviewable: Record<string, unknown>; sentence?: unknown } {
  return isRecord(value) && isRecord(value.reviewable);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function text(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}
