import { browser } from 'wxt/browser';

export const DEBUG_KEY = 'nakama.debug';

const PREFIX = '[bunpro-nakama]';

let enabled = true;
let listening = false;
const onceKeys = new Set<string>();

export function debugIsEnabled(): boolean {
  return enabled;
}

export async function loadDebugEnabled(): Promise<boolean> {
  try {
    const stored = await browser.storage.local.get(DEBUG_KEY);
    const value = stored[DEBUG_KEY];
    enabled = typeof value === 'boolean' ? value : true;
    watchDebugSetting();
  } catch (error) {
    enabled = true;
    console.error(PREFIX, 'could not read the debug setting', error);
  }
  return enabled;
}

export async function saveDebugEnabled(value: boolean): Promise<void> {
  enabled = value;
  await browser.storage.local.set({ [DEBUG_KEY]: value });
}

export function debugLog(message: string, detail?: unknown): void {
  if (!enabled) return;
  if (detail === undefined) console.info(PREFIX, message);
  else console.info(PREFIX, message, detail);
}

export function debugOnce(key: string, message: string, detail?: unknown): void {
  if (onceKeys.has(key)) return;
  onceKeys.add(key);
  debugLog(message, detail);
}

export function debugError(message: string, error: unknown): void {
  console.error(PREFIX, message, error);
}

function watchDebugSetting(): void {
  if (listening) return;
  listening = true;
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(DEBUG_KEY in changes)) return;
    const next = changes[DEBUG_KEY]?.newValue;
    const nextEnabled = typeof next === 'boolean' ? next : true;
    if (nextEnabled === enabled) return;
    enabled = true;
    debugLog(nextEnabled ? 'debug logging is on' : 'debug logging is off');
    enabled = nextEnabled;
  });
}
