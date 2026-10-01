import { calendarDate } from '@bunpro-nakama/session-history';
import { browser } from 'wxt/browser';
import { debugError, debugLog, debugOnce, loadDebugEnabled } from '../src/debug';
import { readQuizContext, collectDiagnostics } from '../src/quiz-context';
import { readPageStudyQuestion, type CapturedStudy } from '../src/study-question';
import { saveDiagnostic, saveRecordedAttempt } from '../src/extension-storage';
import {
  parseQuizMetadata,
  readMetadataElement,
  resultFromMetadata,
  sessionKey,
  shouldRecord,
  type RecordGate,
} from '../src/quiz-meta';

const STUDY_PATH = /\/(reviews|learn\/quiz|cram\/session|kana\/practice)(\/|$)/;

function requestStudyQuestion(): Promise<CapturedStudy | null> {
  const local = readPageStudyQuestion(document);
  if (local) {
    debugLog('read the quiz question from this frame', summarizeStudy(local));
    return Promise.resolve(local);
  }

  const requestId = crypto.randomUUID();
  return new Promise((resolve) => {
    const finish = (question: CapturedStudy | null) => {
      window.removeEventListener('message', onMessage);
      resolve(question);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      const data = event.data as {
        source?: string;
        type?: string;
        requestId?: string;
        question?: CapturedStudy | null;
      } | null;
      if (!data || data.source !== 'bunpro-nakama' || data.type !== 'study-question') return;
      if (data.requestId !== requestId) return;
      finish(data.question ?? null);
    };
    window.addEventListener('message', onMessage);
    window.postMessage({ source: 'bunpro-nakama', type: 'read-question', requestId }, '*');
    window.setTimeout(() => finish(null), 400);
  });
}

function summarizeStudy(study: CapturedStudy | null) {
  if (!study) return null;
  return {
    grammarTitle: study.grammarTitle,
    lessonLabel: study.lessonLabel,
    wordType: study.wordType,
    word: study.word,
    helpPrompt: study.helpPrompt,
  };
}

export default defineContentScript({
  matches: ['https://bunpro.jp/*', 'https://www.bunpro.jp/*'],
  runAt: 'document_idle',
  main(ctx) {
    let gate: RecordGate = { awaitingReset: false };
    let queue = Promise.resolve();
    let metaObserver: MutationObserver | null = null;
    let rootObserver: MutationObserver | null = null;
    let watching: Element | null = null;

    const enqueue = (work: () => Promise<void>) => {
      queue = queue.then(work).catch((error: unknown) => {
        debugError('failed to record an answer', error);
      });
    };

    let sawMetadata = false;
    let lastMetadataKey = '';

    const tick = (reason: string) => {
      if (!STUDY_PATH.test(location.pathname)) {
        debugOnce(`path:${location.pathname}`, 'ignored page; not a study route', location.pathname);
        return;
      }
      const element = readMetadataElement(document);
      if (!element) {
        debugOnce('missing-meta', 'no #quiz-metadata-element yet', {
          reason,
          path: location.pathname,
        });
        return;
      }
      if (!sawMetadata) {
        sawMetadata = true;
        debugLog('found #quiz-metadata-element', {
          reason,
          attributes: element.getAttributeNames().filter((name) => name.startsWith('data-meta-')),
        });
      }
      const metadata = parseQuizMetadata(element);
      const metadataKey = [
        metadata.isPostAttempt,
        metadata.isCorrect,
        metadata.input,
        metadata.totalSubmissions,
        metadata.sessionId,
      ].join('|');
      if (metadataKey !== lastMetadataKey) {
        lastMetadataKey = metadataKey;
        debugLog('quiz metadata changed', {
          reason,
          isPostAttempt: metadata.isPostAttempt,
          isCorrect: metadata.isCorrect,
          isRevealing: metadata.isRevealing,
          input: metadata.input,
          acceptedAnswers: metadata.acceptedAnswers,
          sessionId: metadata.sessionId,
          loc: metadata.loc,
          questionMode: metadata.questionMode,
        });
      }
      const decision = shouldRecord(gate, metadata);
      gate = decision.gate;
      if (!decision.record) {
        if (metadata.isPostAttempt) {
          debugOnce(
            `hold:${metadataKey}`,
            'post-attempt is set, but this answer was already recorded; waiting for the next question',
            { input: metadata.input, isCorrect: metadata.isCorrect },
          );
        }
        return;
      }
      debugLog('recording answer', {
        input: metadata.input,
        isCorrect: metadata.isCorrect,
        acceptedAnswers: metadata.acceptedAnswers,
      });

      const context = readQuizContext(document, metadata);
      const judged = resultFromMetadata(metadata);
      const now = new Date().toISOString();
      const studyPromise = requestStudyQuestion();
      enqueue(async () => {
        const study = await studyPromise;
        if (!study) debugLog('page question was not readable; saving the metadata answer only');
        else debugLog('page question', summarizeStudy(study));
        await saveRecordedAttempt(
          {
            id: crypto.randomUUID(),
            recordedAt: now,
            url: location.href,
            location: metadata.loc,
            inputMode: metadata.inputMode,
            questionMode: metadata.questionMode,
            grammarPoint: study?.grammarTitle || context.grammarPoint,
            prompt: context.prompt,
            userAnswer: metadata.input,
            acceptedAnswers: metadata.acceptedAnswers,
            result: judged.result,
            resultSource: judged.resultSource,
            helpPrompt: study?.helpPrompt || context.helpPrompt,
            lessonId: study?.lessonId ?? null,
            lessonLabel: study?.lessonLabel ?? null,
            partOfSpeech: study?.partOfSpeech ?? null,
            wordType: study?.wordType ?? null,
            word: study?.word ?? null,
            traits: study?.traits ?? [],
          },
          sessionKey(metadata),
          now,
          calendarDate(new Date(now)),
        );
        debugLog('saved answer', {
          result: judged.result,
          input: metadata.input,
          sessionId: sessionKey(metadata),
        });
        await saveDiagnostic(collectDiagnostics(document, location.href, now));
      });
    };

    const attach = () => {
      if (!STUDY_PATH.test(location.pathname)) {
        metaObserver?.disconnect();
        watching = null;
        return;
      }
      const element = readMetadataElement(document);
      if (element === watching) return;
      metaObserver?.disconnect();
      watching = element;
      if (!element) return;
      metaObserver = new MutationObserver(() => tick('attribute'));
      metaObserver.observe(element, { attributes: true });
      debugLog('watching quiz metadata attributes');
      tick('attach');
    };

    const start = () => {
      rootObserver?.disconnect();
      metaObserver?.disconnect();
      watching = null;
      gate = { awaitingReset: false };
      if (!STUDY_PATH.test(location.pathname)) return;
      rootObserver = new MutationObserver(() => attach());
      rootObserver.observe(document.documentElement, { childList: true, subtree: true });
      attach();
    };

    try {
      debugLog('content script loaded', {
        href: location.href,
        manifest: browser.runtime.getManifest().manifest_version,
      });
      void loadDebugEnabled().then((on) => {
        debugLog(on ? 'debug logging is on' : 'debug logging is off');
      });
      start();
      ctx.setInterval(() => tick('poll'), 400);
      ctx.addEventListener(window, 'wxt:locationchange', () => {
        debugLog('location changed', location.href);
        sawMetadata = false;
        lastMetadataKey = '';
        start();
      });
    } catch (error) {
      debugError('failed to start on this page', error);
    }
    ctx.onInvalidated(() => {
      rootObserver?.disconnect();
      metaObserver?.disconnect();
    });
  },
});
