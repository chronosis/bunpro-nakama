import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  sessionDate: text('session_date'),
  importedAt: text('imported_at').notNull(),
});

export const attempts = sqliteTable('attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  recordedAt: text('recorded_at').notNull(),
  url: text('url').notNull(),
  location: text('location'),
  inputMode: text('input_mode'),
  questionMode: text('question_mode'),
  grammarPoint: text('grammar_point'),
  prompt: text('prompt'),
  userAnswer: text('user_answer').notNull(),
  acceptedAnswersJson: text('accepted_answers_json').notNull(),
  result: text('result').notNull(),
  resultSource: text('result_source').notNull(),
  helpPrompt: text('help_prompt'),
  lessonId: text('lesson_id'),
  lessonLabel: text('lesson_label'),
  partOfSpeech: text('part_of_speech'),
  wordType: text('word_type'),
  word: text('word'),
  traitsJson: text('traits_json'),
});

export const planSettings = sqliteTable('plan_settings', {
  id: text('id').primaryKey(),
  lookbackDays: integer('lookback_days').notNull(),
  maxSessions: integer('max_sessions').notNull(),
});

export const lessonPlans = sqliteTable('lesson_plans', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  model: text('model').notNull(),
  sessionIdsJson: text('session_ids_json').notNull(),
  summary: text('summary').notNull(),
  bodyJson: text('body_json').notNull(),
});
