import type { Attempt } from '@bunpro-nakama/session-history';
import { browser } from 'wxt/browser';
import {
  emptyHistory,
  endActiveSession,
  pushDiagnostic,
  recordAttempt,
  toHistoryExport,
  type DiagnosticSnapshot,
  type StoredHistory,
} from './history-store';

const STORAGE_KEY = 'nakama.history.v1';

export async function loadHistory(): Promise<StoredHistory> {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  const value = stored[STORAGE_KEY];
  if (!value || typeof value !== 'object') return emptyHistory();
  return { ...emptyHistory(), ...(value as StoredHistory) };
}

export async function saveHistory(state: StoredHistory): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: state });
}

export async function saveRecordedAttempt(
  attempt: Attempt,
  sessionId: string,
  now: string,
  sessionDate: string,
): Promise<void> {
  const state = await loadHistory();
  await saveHistory(recordAttempt(state, attempt, sessionId, now, sessionDate));
}

export async function saveEndedSession(now: string): Promise<StoredHistory> {
  const next = endActiveSession(await loadHistory(), now);
  await saveHistory(next);
  return next;
}

export async function saveDiagnostic(snapshot: DiagnosticSnapshot): Promise<void> {
  const state = await loadHistory();
  if (!state.captureDiagnostics) return;
  await saveHistory(pushDiagnostic(state, snapshot));
}

export async function setCaptureDiagnostics(enabled: boolean): Promise<StoredHistory> {
  const next = { ...(await loadHistory()), captureDiagnostics: enabled };
  await saveHistory(next);
  return next;
}

export async function clearHistory(): Promise<StoredHistory> {
  const next = emptyHistory();
  await saveHistory(next);
  return next;
}

export async function exportHistory(now: string) {
  return toHistoryExport(await loadHistory(), now);
}

export { STORAGE_KEY };
