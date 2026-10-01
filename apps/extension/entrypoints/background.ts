import { browser } from 'wxt/browser';

interface DownloadRequest {
  type: 'nakama-download';
  filename: string;
  json: string;
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isDownloadRequest(message)) return;
    void saveJson(message.filename, message.json).then(
      () => sendResponse({ ok: true }),
      (error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'download failed',
        }),
    );
    return true;
  });
});

function isDownloadRequest(message: unknown): message is DownloadRequest {
  if (!message || typeof message !== 'object') return false;
  const value = message as { type?: unknown; filename?: unknown; json?: unknown };
  return (
    value.type === 'nakama-download' &&
    typeof value.filename === 'string' &&
    typeof value.json === 'string'
  );
}

async function saveJson(filename: string, json: string) {
  if (!/^bunpro-nakama[\w.-]*\.json$/.test(filename)) {
    throw new Error('Unexpected download name');
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  try {
    await browser.downloads.download({
      url,
      filename,
      saveAs: false,
      conflictAction: 'uniquify',
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
