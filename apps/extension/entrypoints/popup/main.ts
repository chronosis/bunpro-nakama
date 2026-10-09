import { browser } from 'wxt/browser';
import { loadDebugEnabled, saveDebugEnabled } from '../../src/debug';
import {
  clearHistory,
  exportHistory,
  loadHistory,
  saveEndedSession,
  setCaptureDiagnostics,
  STORAGE_KEY,
} from '../../src/extension-storage';

const status = document.querySelector('#status');
const debug = document.querySelector<HTMLInputElement>('#debug');
const diagnostics = document.querySelector<HTMLInputElement>('#diagnostics');
const exportButton = document.querySelector<HTMLButtonElement>('#export');
const diagnosticsButton = document.querySelector<HTMLButtonElement>('#export-diagnostics');
const endButton = document.querySelector<HTMLButtonElement>('#end');
const clearButton = document.querySelector<HTMLButtonElement>('#clear');
const badTranslationButton = document.querySelector<HTMLButtonElement>('#bad-translations');
let clearArmed = false;

function setStatus(message: string) {
  if (status) status.textContent = message;
}

function disarmClear() {
  clearArmed = false;
  if (clearButton) clearButton.textContent = 'Clear history';
}

async function download(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  try {
    const response = (await browser.runtime.sendMessage({
      type: 'nakama-download',
      filename,
      json,
    })) as { ok?: boolean; error?: string } | undefined;
    if (!response?.ok) {
      throw new Error(response?.error || 'download failed');
    }
    setStatus(`Saved ${filename} to your downloads folder.`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'download failed';
    setStatus(`Could not save ${filename}: ${detail.slice(0, 180)}`);
    console.error('[bunpro-nakama]', error);
  }
}

async function render() {
  const history = await loadHistory();
  const attempts = history.sessions.reduce((sum, session) => sum + session.attempts.length, 0);
  if (!clearArmed) {
    setStatus(
      `${history.sessions.length} sessions, ${attempts} answers, ${history.diagnostics.length} diagnostic snapshots${
        history.activeSessionId ? '. Recording the current session.' : '.'
      }`,
    );
  }
  if (diagnostics) diagnostics.checked = history.captureDiagnostics;
  if (debug) debug.checked = await loadDebugEnabled();
}

debug?.addEventListener('change', () => {
  void saveDebugEnabled(debug.checked);
});

diagnostics?.addEventListener('change', () => {
  void setCaptureDiagnostics(diagnostics.checked).then(render);
});

badTranslationButton?.addEventListener('click', () => {
  disarmClear();
  void browser.tabs.create({ url: browser.runtime.getURL('/translation-review.html') });
});

exportButton?.addEventListener('click', () => {
  disarmClear();
  void exportHistory(new Date().toISOString()).then((history) => {
    return download(`bunpro-nakama-${history.exportedAt.slice(0, 10)}.json`, history);
  });
});

diagnosticsButton?.addEventListener('click', () => {
  disarmClear();
  void loadHistory().then((history) => {
    const count = history.diagnostics.length;
    if (count === 0) {
      setStatus(
        'No diagnostic snapshots yet. Turn on “Save page diagnostics”, answer a question, then export again.',
      );
      return;
    }
    return download('bunpro-nakama-diagnostics.json', history.diagnostics);
  });
});

endButton?.addEventListener('click', () => {
  disarmClear();
  void saveEndedSession(new Date().toISOString()).then(render);
});

clearButton?.addEventListener('click', () => {
  if (!clearArmed) {
    clearArmed = true;
    clearButton.textContent = 'Confirm clear';
    setStatus('Click Confirm clear to delete every recorded answer in this browser.');
    return;
  }
  clearArmed = false;
  void clearHistory().then(render);
});

browser.storage.onChanged.addListener((_changes, area) => {
  if (area === 'local') void render();
});

void render();

export { STORAGE_KEY };
