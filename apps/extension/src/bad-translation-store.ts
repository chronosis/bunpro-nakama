import { browser } from 'wxt/browser';
import {
  BAD_TRANSLATION_KEY,
  resolveStored,
  type BadTranslation,
} from './bad-translations';

export async function loadBadTranslations(): Promise<BadTranslation[]> {
  const stored = await browser.storage.local.get(BAD_TRANSLATION_KEY);
  const items = resolveStored(
    BAD_TRANSLATION_KEY in stored ? stored[BAD_TRANSLATION_KEY] : undefined,
  );
  if (!(BAD_TRANSLATION_KEY in stored)) {
    await browser.storage.local.set({ [BAD_TRANSLATION_KEY]: items });
  }
  return items;
}

export async function saveBadTranslations(items: readonly BadTranslation[]): Promise<void> {
  await browser.storage.local.set({ [BAD_TRANSLATION_KEY]: items });
}
