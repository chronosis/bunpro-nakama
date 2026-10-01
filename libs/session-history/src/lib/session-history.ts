import { z } from 'zod';

export const HISTORY_FORMAT = 'bunpro-nakama.history' as const;
export const HISTORY_VERSION = 1 as const;
export const DEFAULT_LOOKBACK_DAYS = 14;
export const DEFAULT_MAX_SESSIONS = 15;

export const attemptResultSchema = z.enum(['correct', 'incorrect', 'unknown']);
export const resultSourceSchema = z.enum([
  'metadata',
  'dom',
  'answer-match',
  'unknown',
]);

export const attemptSchema = z.object({
  id: z.string().min(1),
  recordedAt: z.string().min(1),
  url: z.string().min(1),
  location: z.string().nullable(),
  inputMode: z.string().nullable(),
  questionMode: z.string().nullable(),
  grammarPoint: z.string().nullable(),
  prompt: z.string().nullable(),
  userAnswer: z.string(),
  acceptedAnswers: z.array(z.string()),
  result: attemptResultSchema,
  resultSource: resultSourceSchema,
  helpPrompt: z.string().nullable().optional(),
  lessonId: z.string().nullable().optional(),
  lessonLabel: z.string().nullable().optional(),
  partOfSpeech: z.string().nullable().optional(),
  wordType: z.string().nullable().optional(),
  word: z.string().nullable().optional(),
  traits: z.array(z.string()).optional(),
});

export const reviewSessionSchema = z.object({
  id: z.string().min(1),
  startedAt: z.string().min(1),
  endedAt: z.string().nullable(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  attempts: z.array(attemptSchema),
});

export const historyExportSchema = z.object({
  format: z.literal(HISTORY_FORMAT),
  version: z.literal(HISTORY_VERSION),
  exportedAt: z.string().min(1),
  sessions: z.array(reviewSessionSchema),
});

export type AttemptResult = z.infer<typeof attemptResultSchema>;
export type ResultSource = z.infer<typeof resultSourceSchema>;
export type Attempt = z.infer<typeof attemptSchema>;
export type ReviewSession = z.infer<typeof reviewSessionSchema>;
export type HistoryExport = z.infer<typeof historyExportSchema>;

export function createEmptyHistory(exportedAt: string): HistoryExport {
  return {
    format: HISTORY_FORMAT,
    version: HISTORY_VERSION,
    exportedAt,
    sessions: [],
  };
}

export function parseHistoryExport(input: unknown) {
  return historyExportSchema.safeParse(input);
}

export function calendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftCalendarDate(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const shifted = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export interface PlanWindow {
  lookbackDays: number;
  maxSessions: number;
}

export interface DatedSession {
  id: string;
  startedAt: string;
  sessionDate?: string | null;
}

export function sessionCalendarDate(session: DatedSession): string {
  if (session.sessionDate && /^\d{4}-\d{2}-\d{2}$/.test(session.sessionDate)) {
    return session.sessionDate;
  }
  return session.startedAt.slice(0, 10);
}

const INLINE_LEAF = /<(span|strong)\b[^>]*>((?:(?!<\/?(?:span|strong)\b)[\s\S])*)<\/\1>/gi;

/** Bunpro wraps highlighted grammar in span tags and stronger highlights in strong tags. */
export function emphasizeSpans(value: string): string {
  let current = value;
  for (let pass = 0; pass < 8; pass += 1) {
    INLINE_LEAF.lastIndex = 0;
    const next = current.replace(INLINE_LEAF, (_match, tag: string, inner: string) =>
      emphasizeInline(tag, inner),
    );
    if (next === current) break;
    current = next;
  }
  return current.replace(/<\/?(?:span|strong)\b[^>]*>/gi, '');
}

/** Keep the stronger mark when a span and a strong tag wrap the same text. */
export function emphasizeInline(tag: string, inner: string): string {
  const mark = tag.toLowerCase() === 'strong' ? '***' : '**';
  const existing = existingEmphasis(inner);
  if (!existing) return `${mark}${inner}${mark}`;
  const chosen = mark.length >= existing.mark.length ? mark : existing.mark;
  return `${chosen}${existing.text}${chosen}`;
}

function existingEmphasis(value: string): { mark: '**' | '***'; text: string } | null {
  if (value.startsWith('***') && value.endsWith('***') && value.length > 6 && !value.slice(3, -3).includes('*')) {
    return { mark: '***', text: value.slice(3, -3) };
  }
  if (value.startsWith('**') && value.endsWith('**') && value.length > 4 && !value.slice(2, -2).includes('*')) {
    return { mark: '**', text: value.slice(2, -2) };
  }
  return null;
}

export function selectSessionsForPlan<T extends DatedSession>(
  sessions: T[],
  window: PlanWindow,
  today: string,
): T[] {
  const cutoff = shiftCalendarDate(today, -(window.lookbackDays - 1));
  return sessions
    .filter((session) => {
      const date = sessionCalendarDate(session);
      return date >= cutoff && date <= today;
    })
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
    .slice(0, window.maxSessions);
}
