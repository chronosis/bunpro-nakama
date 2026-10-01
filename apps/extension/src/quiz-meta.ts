export interface QuizMetadata {
  raw: Record<string, string>;
  loc: string | null;
  sessionId: string | null;
  input: string;
  isCorrect: boolean | null;
  isPostAttempt: boolean;
  isRevealing: boolean;
  inputMode: string | null;
  questionMode: string | null;
  acceptedAnswers: string[];
  totalSubmissions: number | null;
}

const METADATA_ID = 'quiz-metadata-element';

export function readMetadataElement(root: ParentNode): Element | null {
  return root.querySelector(`#${METADATA_ID}`);
}

export function parseQuizMetadata(element: Element): QuizMetadata {
  const raw: Record<string, string> = {};
  for (const name of element.getAttributeNames()) {
    if (!name.startsWith('data-meta-')) continue;
    raw[name] = element.getAttribute(name) ?? '';
  }

  return {
    raw,
    loc: clean(raw['data-meta-loc']),
    sessionId: clean(raw['data-meta-session-id']),
    input: raw['data-meta-input'] === 'null' ? '' : (raw['data-meta-input'] ?? ''),
    isCorrect: booleanAttr(raw['data-meta-is-correct']),
    isPostAttempt: raw['data-meta-is-post-attempt'] === 'true',
    isRevealing: raw['data-meta-is-revealing'] === 'true',
    inputMode: clean(raw['data-meta-input-mode']),
    questionMode: clean(raw['data-meta-question-mode']),
    acceptedAnswers: parseAnswers(raw['data-meta-answers-array']),
    totalSubmissions: numberAttr(raw['data-meta-total-submissions-count']),
  };
}

export interface RecordGate {
  awaitingReset: boolean;
}

export function shouldRecord(
  gate: RecordGate,
  metadata: QuizMetadata,
): { gate: RecordGate; record: boolean } {
  if (!metadata.isPostAttempt) {
    return { gate: { awaitingReset: false }, record: false };
  }
  if (gate.awaitingReset) {
    return { gate, record: false };
  }
  return { gate: { awaitingReset: true }, record: true };
}

export function resultFromMetadata(metadata: QuizMetadata): {
  result: 'correct' | 'incorrect' | 'unknown';
  resultSource: 'metadata' | 'answer-match' | 'unknown';
} {
  if (metadata.isCorrect === true) {
    return { result: 'correct', resultSource: 'metadata' };
  }
  if (metadata.isCorrect === false) {
    return { result: 'incorrect', resultSource: 'metadata' };
  }
  const typed = normalizeAnswer(metadata.input);
  if (typed && metadata.acceptedAnswers.some((answer) => normalizeAnswer(answer) === typed)) {
    return { result: 'correct', resultSource: 'answer-match' };
  }
  if (typed && metadata.acceptedAnswers.length > 0) {
    return { result: 'incorrect', resultSource: 'answer-match' };
  }
  return { result: 'unknown', resultSource: 'unknown' };
}

export function sessionKey(metadata: QuizMetadata): string {
  if (metadata.sessionId) {
    return `bunpro:${metadata.loc ?? 'quiz'}:${metadata.sessionId}`;
  }
  return `local:${metadata.loc ?? 'quiz'}`;
}

export function grammarPointFromInfo(raw: string | undefined): string | null {
  if (!raw || raw === 'null') return null;
  try {
    return findTitle(JSON.parse(raw), 0);
  } catch {
    return null;
  }
}

function findTitle(value: unknown, depth: number): string | null {
  if (!value || typeof value !== 'object' || depth > 4) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTitle(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  for (const key of ['title', 'grammar_point', 'name']) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  if ('reviewable' in record) {
    const nested = findTitle(record.reviewable, depth + 1);
    if (nested) return nested;
  }
  if (typeof record.type === 'string' && (typeof record.id === 'number' || typeof record.id === 'string')) {
    return `${record.type} #${record.id}`;
  }
  return null;
}

function parseAnswers(raw: string | undefined): string[] {
  if (!raw || raw === 'null') return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    return [];
  }
  return [];
}

function booleanAttr(value: string | undefined): boolean | null {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function numberAttr(value: string | undefined): number | null {
  if (!value || value === 'null') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value: string | undefined): string | null {
  if (!value || value === 'null' || value === 'undefined') return null;
  return value;
}

export function normalizeAnswer(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, '').toLowerCase();
}
