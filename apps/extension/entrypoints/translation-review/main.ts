import { browser } from 'wxt/browser';
import { BAD_TRANSLATION_KEY, removeBadTranslation } from '../../src/bad-translations';
import { fillBadTranslationList } from '../../src/bad-translation-list';
import { loadBadTranslations, saveBadTranslations } from '../../src/bad-translation-store';

const list = document.querySelector<HTMLTableSectionElement>('#bad-translation-list');

async function render() {
  if (!list) return;
  const items = await loadBadTranslations();
  fillBadTranslationList(list, items, (id) => {
    void loadBadTranslations().then((current) =>
      saveBadTranslations(removeBadTranslation(current, id)),
    );
  });
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && BAD_TRANSLATION_KEY in changes) void render();
});

void render();
