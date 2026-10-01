import { emphasizeSpans } from '@bunpro-nakama/session-history';
import { z } from 'zod';
import { closestAcceptedAnswer, compareConjugation, toHiragana, type StemComparison } from '../japanese/conjugate';

const lessonPlanFields = {
  title: z.string().optional(),
  summary: z.string().min(1),
  patterns: z.array(
    z.object({
      title: z.string(),
      evidence: z.string(),
      suggestion: z.string(),
      missedQuestions: z.array(z.string()).default([]),
    }),
  ),
  focusItems: z.array(
    z.object({
      label: z.string(),
      why: z.string(),
      practice: z.string(),
    }),
  ),
};

export const lessonPlanBodySchema = z.object(lessonPlanFields).transform(splitPlanHeading);

function splitPlanHeading<T extends { title?: string; summary: string }>(plan: T): Omit<T, 'title'> & { title: string; summary: string } {
  let title = (plan.title ?? '').replace(/^Title:\s*/i, '').trim();
  let summary = plan.summary.trim();
  const leading = summary.match(/^Title:\s*(.+?)(?:\r?\n|$)([\s\S]*)$/);
  const heading = leading?.[1];
  if (heading) {
    if (!title) title = heading.trim();
    summary = (leading?.[2] ?? '').trim();
  }
  return { ...plan, title: title || 'Lesson plan', summary };
}

export type LessonPlanBody = z.infer<typeof lessonPlanBodySchema>;

export interface PromptAttempt {
  grammarPoint: string | null;
  prompt: string | null;
  questionMode: string | null;
  userAnswer: string;
  acceptedAnswers: string[];
  result: string;
  helpPrompt?: string | null;
  lessonLabel?: string | null;
  partOfSpeech?: string | null;
  wordType?: string | null;
  word?: string | null;
  traits?: string[];
}

export const LESSON_PLAN_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'patterns', 'focusItems'],
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    patterns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'evidence', 'suggestion', 'missedQuestions'],
        properties: {
          title: { type: 'string' },
          evidence: { type: 'string' },
          suggestion: { type: 'string' },
          missedQuestions: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
    focusItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'why', 'practice'],
        properties: {
          label: { type: 'string' },
          why: { type: 'string' },
          practice: { type: 'string' },
        },
      },
    },
  },
} as const;

const PATTERN_MISS_THRESHOLD = 3;

export function describeStruggles(attempts: PromptAttempt[]): string[] {
  const incorrect = attempts.filter((attempt) => attempt.result === 'incorrect');
  const groups = [
    stemLines(incorrect),
    groupLine('Word type', incorrect, (attempt) => attempt.wordType),
    groupLine('Part of speech', incorrect, (attempt) => attempt.partOfSpeech),
    groupLine('Help prompt', incorrect, (attempt) => attempt.helpPrompt),
    groupLine('Lesson', incorrect, (attempt) => attempt.lessonLabel),
    groupLine('Word', incorrect, (attempt) => expectedWord(attempt)),
    groupLine('Grammar', incorrect, (attempt) => attempt.grammarPoint),
  ];
  return groups.filter((line): line is string => line !== null);
}

function stemLines(attempts: PromptAttempt[]): string | null {
  const groups = new Map<string, { count: number; comparison: StemComparison }>();
  for (const attempt of attempts) {
    const comparison = compareConjugation(attempt.userAnswer, attempt.acceptedAnswers);
    if (!comparison) continue;
    const current = groups.get(comparison.lemma);
    if (current) current.count += 1;
    else groups.set(comparison.lemma, { count: 1, comparison });
  }
  const repeated = [...groups.values()]
    .filter((group) => group.count >= PATTERN_MISS_THRESHOLD)
    .sort((left, right) => right.count - left.count || left.comparison.lemma.localeCompare(right.comparison.lemma, 'ja'));
  if (repeated.length === 0) return null;
  return repeated
    .map((group) => {
      const { stem, lemma, reading } = group.comparison;
      return `- Word stem "${stem}" (${lemma} / ${reading}): ${group.count} misses`;
    })
    .join('\n');
}

function expectedWord(attempt: PromptAttempt): string | null {
  const closest = closestAcceptedAnswer(attempt.userAnswer, attempt.acceptedAnswers);
  if (!closest) return null;
  return toHiragana(closest);
}

function groupLine(
  label: string,
  attempts: PromptAttempt[],
  valueOf: (attempt: PromptAttempt) => string | null | undefined,
): string | null {
  const counts = new Map<string, number>();
  for (const attempt of attempts) {
    const value = valueOf(attempt)?.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const repeated = [...counts.entries()]
    .filter(([, count]) => count >= PATTERN_MISS_THRESHOLD)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'ja'));
  if (repeated.length === 0) return null;
  return repeated
    .map(([value, count]) => `- ${label} "${value}": ${count} miss${count === 1 ? '' : 'es'}`)
    .join('\n');
}

export function buildLessonPrompt(attempts: PromptAttempt[]): string {
  const shown = attempts.filter((attempt) => attempt.result === 'incorrect').map((attempt) => ({
    ...attempt,
    grammarPoint: cleanMarkup(attempt.grammarPoint),
    prompt: cleanMarkup(attempt.prompt),
    helpPrompt: cleanMarkup(attempt.helpPrompt),
    word: cleanMarkup(attempt.word),
  }));
  const lines = shown.map((attempt, index) => {
    const label = attempt.grammarPoint || 'unlabeled item';
    const comparison = compareConjugation(attempt.userAnswer, attempt.acceptedAnswers);
    return [
      `${index + 1}. ${label}`,
      `help prompt: ${attempt.helpPrompt ?? ''}`,
      `lesson: ${attempt.lessonLabel ?? ''}`,
      `word: ${attempt.word ?? ''}`,
      `word type: ${attempt.wordType ?? ''}`,
      `part of speech: ${attempt.partOfSpeech ?? ''}`,
      comparison
        ? `word stem: ${comparison.stem} (${comparison.lemma}) · student ${comparison.actualForm} · accepted ${comparison.expectedForm}`
        : 'word stem: (no shared conjugation)',
      `question: ${attempt.prompt ?? ''}`,
      `student: ${attempt.userAnswer}`,
      `accepted: ${attempt.acceptedAnswers.join(' | ') || '(none recorded)'}`,
    ].join('\n');
  });
  const struggles = describeStruggles(shown);

  return [
    'You are a Japanese tutor reviewing Bunpro quiz history.',
    'Use only the attempts below. Do not invent grammar the student did not see.',
    'Look for repeated misses on the same word stem, closest accepted answer, help prompt, lesson, word type, part of speech, or grammar point.',
    'Compare the student answer with the accepted answers and use the closest accepted answer. Read both in hiragana.',
    'The question prompt is only the sentence the student was shown. Do not use it to find patterns.',
    'A pattern needs at least 3 misses. Do not treat traits as the error.',
    'Point out those patterns, confusing answer pairs, and a short practice plan.',
    'Set title to one line in the form Title: <short summary>. Keep that title to a few words.',
    'summary is the description shown under the title. Do not use summary as the heading, and do not repeat the title line inside it.',
    'Give each pattern its own entry. Give each confusing answer pair its own entry too.',
    'For that entry, repeat every missed question that belongs to it. Copy each question from the attempt question line, and include the student answer and the closest accepted answer.',
    'Put that full list in missedQuestions, one question per entry. Do not summarize, skip, or merge those questions.',
    'Use the question only as the sentence to repeat. Do not use it to decide the pattern.',
    'The attempts below are incorrect answers only. Do not discuss answers that are not listed.',
    '',
    'Misses grouped for pattern finding:',
    struggles.length > 0 ? struggles.join('\n') : 'No pattern reached 3 misses.',
    '',
    'Attempts:',
    lines.join('\n\n'),
  ].join('\n');
}

function cleanMarkup(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  return emphasizeSpans(value);
}

export function parseLessonPlan(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return lessonPlanBodySchema.safeParse(JSON.parse(trimmed));
  } catch (error) {
    return {
      success: false as const,
      error: {
        issues: [
          {
            message: error instanceof Error ? error.message : 'Lesson plan was not valid JSON',
          },
        ],
      },
    };
  }
}
