import { readPageStudyQuestion } from '../src/study-question';

export default defineContentScript({
  matches: ['https://bunpro.jp/*', 'https://www.bunpro.jp/*'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      const data = event.data as { source?: string; type?: string; requestId?: string } | null;
      if (!data || data.source !== 'bunpro-nakama' || data.type !== 'read-question') return;
      window.postMessage(
        {
          source: 'bunpro-nakama',
          type: 'study-question',
          requestId: data.requestId,
          question: readPageStudyQuestion(document),
        },
        '*',
      );
    });
  },
});
