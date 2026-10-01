# Bunpro Nakama

Local companion for [Bunpro](https://bunpro.jp) reviews. An Nx workspace with two apps:

- `extension` — a TypeScript browser extension (Chrome and Firefox) that records answers during reviews.
- `web` — a Nuxt app that imports those sessions into SQLite and asks Gemini for a lesson plan.

Both run on your machine. The Gemini API key stays in the Nuxt server.

## Layout

| Project | Path | What it does |
| --- | --- | --- |
| `extension` | `apps/extension` | WXT extension. Watches Bunpro's `#quiz-metadata-element` and stores each submission in `browser.storage.local`. |
| `web` | `apps/web` | Nuxt 4 + Nuxt UI, Drizzle, SQLite. Import, browse sessions, generate lesson plans. |
| `session-history` | `libs/session-history` | Zod schema for the JSON file the extension exports and the app imports. |

## Setup

```sh
pnpm install
cp apps/web/sample.env apps/web/.env
```

Put a Gemini API key in `apps/web/.env` when you want lesson plans. The extension does not need it.

## Web app

```sh
pnpm dev:web
```

Opens at http://localhost:4200. Import `apps/web/public/sample-history.json` to see the session browser without a live review. Lesson plans use the newest 15 sessions from the last 14 days unless you change that under Settings.

## Extension

Chrome:

```sh
pnpm dev:extension
```

Firefox:

```sh
pnpm dev:extension:firefox
```

WXT opens a browser with the extension loaded. For a normal profile, build and load the output folder yourself:

```sh
nx build extension
nx build-firefox extension
```

- Chrome: `apps/extension/.output/chrome-mv3` (Load unpacked)
- Firefox: `apps/extension/.output/firefox-mv3` (`about:debugging` → Load Temporary Add-on → `manifest.json`)

Open a Bunpro review, cram session, or learn quiz. The popup shows how many answers were stored and can download `bunpro-nakama-history` JSON. Import that file on the Sessions page. Importing the same file again does not duplicate sessions.

## How answers are recorded

Bunpro's quiz (the Next.js pages `/reviews`, `/learn/quiz`, `/cram/session`, and `/kana/practice`) renders a hidden node:

```html
<div id="quiz-metadata-element" aria-hidden="true"></div>
```

Its attributes are copied from quiz state, including:

- `data-meta-input` — the submitted answer
- `data-meta-is-correct` — `true` or `false` after a submission
- `data-meta-is-post-attempt` — flips to `true` when the answer is graded
- `data-meta-answers-array` — JSON array of accepted answers
- `data-meta-session-id`, `data-meta-loc`, `data-meta-input-mode`, `data-meta-question-mode`

The extension records one attempt each time `data-meta-is-post-attempt` becomes `true`, then waits until it returns to `false` before recording the next item. `data-meta-is-correct` can already be `false` before a submission, so it is only read together with that post-attempt flag. The first answer in a Bunpro session stores that calendar date as `sessionDate`. The sentence is read from `.bp-quiz-question`, and the form hint on `.bp-quiz-tense` (for example "Negative non-past, polite") is stored as the help prompt. The quiz question also carries the grammar title, lesson, part of speech, and word type; those are saved with the answer when the page exposes them.

A logged-in review page confirmed `#quiz-metadata-element` and these attributes. Turn on **Save page diagnostics** in the popup if a later session disagrees; export the diagnostics JSON and the parser can be adjusted from that capture.

## Checks

```sh
pnpm test
pnpm lint
pnpm typecheck
```
