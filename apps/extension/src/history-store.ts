import {
  HISTORY_FORMAT,
  HISTORY_VERSION,
  type Attempt,
  type HistoryExport,
  type ReviewSession,
} from '@bunpro-nakama/session-history';

export interface DiagnosticSnapshot {
  url: string;
  capturedAt: string;
  metadataHtml: string | null;
  classes: string[];
}

export interface StoredHistory {
  sessions: ReviewSession[];
  activeSessionId: string | null;
  captureDiagnostics: boolean;
  diagnostics: DiagnosticSnapshot[];
}

export function emptyHistory(): StoredHistory {
  return {
    sessions: [],
    activeSessionId: null,
    captureDiagnostics: false,
    diagnostics: [],
  };
}

export function recordAttempt(
  state: StoredHistory,
  attempt: Attempt,
  sessionId: string,
  now: string,
  sessionDate?: string,
): StoredHistory {
  const sessions = state.sessions.map((session) => ({
    ...session,
    attempts: [...session.attempts],
  }));
  let active = sessions.find((session) => session.id === sessionId);
  if (!active) {
    if (state.activeSessionId && state.activeSessionId !== sessionId) {
      const previous = sessions.find((session) => session.id === state.activeSessionId);
      if (previous && previous.endedAt === null) previous.endedAt = now;
    }
    active = {
      id: sessionId,
      startedAt: now,
      endedAt: null,
      sessionDate: sessionDate ?? now.slice(0, 10),
      attempts: [],
    };
    sessions.push(active);
  }
  if (active.attempts.some((existing) => existing.id === attempt.id)) {
    return { ...state, sessions, activeSessionId: sessionId };
  }
  active.attempts.push(attempt);
  return {
    ...state,
    sessions,
    activeSessionId: sessionId,
  };
}

export function endActiveSession(state: StoredHistory, now: string): StoredHistory {
  if (!state.activeSessionId) return state;
  return {
    ...state,
    activeSessionId: null,
    sessions: state.sessions.map((session) =>
      session.id === state.activeSessionId && session.endedAt === null
        ? { ...session, endedAt: now }
        : session,
    ),
  };
}

export function toHistoryExport(state: StoredHistory, exportedAt: string): HistoryExport {
  return {
    format: HISTORY_FORMAT,
    version: HISTORY_VERSION,
    exportedAt,
    sessions: state.sessions,
  };
}

export function pushDiagnostic(
  state: StoredHistory,
  snapshot: DiagnosticSnapshot,
): StoredHistory {
  const diagnostics = [...state.diagnostics, snapshot].slice(-20);
  return { ...state, diagnostics };
}
