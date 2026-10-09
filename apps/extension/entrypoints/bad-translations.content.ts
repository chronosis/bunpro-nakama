import { browser } from 'wxt/browser';
import {
  BAD_TRANSLATION_KEY,
  findBadTranslation,
  resolveStored,
  upsertBadTranslation,
  type BadTranslation,
} from '../src/bad-translations';
import {
  clearNakamaUi,
  ensureFlagButton,
  openTranslationModal,
  paintTranslations,
  readQuizSurface,
} from '../src/bad-translation-page';
import { debugError, debugLog } from '../src/debug';
import { loadBadTranslations, saveBadTranslations } from '../src/bad-translation-store';

const STUDY_PATH = /\/(reviews|learn\/quiz|cram\/session|kana\/practice)(\/|$)/;

export default defineContentScript({
  matches: ['https://bunpro.jp/*', 'https://www.bunpro.jp/*'],
  runAt: 'document_idle',
  main(ctx) {
    let items: BadTranslation[] = [];
    let modalOpen = false;

    const openFlagModal = () => {
      if (modalOpen) return;
      modalOpen = true;
      try {
        const surface = readQuizSurface(document);
        debugLog('flag clicked', surface
          ? { question: surface.question, translation: surface.translation }
          : null);
        const existing = surface
          ? findBadTranslation(items, surface.question, surface.translation)
          : null;
        openTranslationModal(
          document,
          surface,
          existing,
          (alternative) => {
            if (!surface) return;
            const next = upsertBadTranslation(items, {
              question: surface.question,
              translation: surface.translation,
              alternative,
              nuance: surface.nuance,
              now: new Date().toISOString(),
            });
            items = next;
            void saveBadTranslations(next).then(
              () => debugLog('saved flagged translation', { question: surface.question }),
              (error: unknown) => debugError('could not save the flagged translation', error),
            );
          },
          () => {
            modalOpen = false;
            sync();
          },
        );
      } catch (error) {
        modalOpen = false;
        debugError('could not open the translation flag dialog', error);
      }
    };

    const sync = () => {
      if (!STUDY_PATH.test(location.pathname)) {
        modalOpen = false;
        clearNakamaUi(document);
        return;
      }
      if (modalOpen) return;
      paintTranslations(document, items);
      ensureFlagButton(document, openFlagModal);
    };

    const onFlagClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('[data-nakama-flag]')) return;
      event.preventDefault();
      event.stopPropagation();
      openFlagModal();
    };
    document.addEventListener('click', onFlagClick, true);

    sync();
    void loadBadTranslations().then((loaded) => {
      items = loaded;
      sync();
    });

    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !(BAD_TRANSLATION_KEY in changes)) return;
      items = resolveStored(changes[BAD_TRANSLATION_KEY]?.newValue);
      sync();
    });

    const observer = new MutationObserver(() => sync());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    ctx.addEventListener(window, 'wxt:locationchange', () => sync());
    ctx.onInvalidated(() => {
      observer.disconnect();
      document.removeEventListener('click', onFlagClick, true);
    });
  },
});
