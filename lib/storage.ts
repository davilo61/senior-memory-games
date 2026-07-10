"use client";

import { useSyncExternalStore } from "react";
import type { Resident, GameSession, Difficulty, GameId } from "./types";

const RESIDENTS_KEY = "smg_residents";
const SESSIONS_KEY = "smg_sessions";
const EMPTY_RESIDENTS: Resident[] = [];
const EMPTY_SESSIONS: GameSession[] = [];

let residentsRawCache: string | null | undefined;
let residentsSnapshotCache: Resident[] = EMPTY_RESIDENTS;
let sessionsRawCache: string | null | undefined;
let sessionsSnapshotCache: GameSession[] = EMPTY_SESSIONS;

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeSession(raw: Partial<GameSession>): GameSession | null {
  if (!raw.id || !raw.residentId || !raw.date) {
    return null;
  }

  const score = typeof raw.score === "number" ? raw.score : 0;
  const total = typeof raw.total === "number" && raw.total > 0 ? raw.total : 1;
  const difficulty: Difficulty =
    raw.difficulty === "easy" || raw.difficulty === "medium" || raw.difficulty === "hard"
      ? raw.difficulty
      : "medium";
  const gameId: GameId =
    raw.gameId === "picture-memory" || raw.gameId === "pair-match" || raw.gameId === "sequence-recall"
      ? raw.gameId
      : "picture-memory";

  return {
    id: raw.id,
    residentId: raw.residentId,
    date: raw.date,
    gameId,
    score,
    total,
    difficulty,
  };
}

const residentListeners = new Set<() => void>();
const sessionListeners = new Set<() => void>();

function subscribeResidents(listener: () => void): () => void {
  residentListeners.add(listener);

  function onStorage(event: StorageEvent): void {
    if (event.key === RESIDENTS_KEY) {
      listener();
    }
  }

  window.addEventListener("storage", onStorage);

  return () => {
    residentListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function subscribeSessions(listener: () => void): () => void {
  sessionListeners.add(listener);

  function onStorage(event: StorageEvent): void {
    if (event.key === SESSIONS_KEY) {
      listener();
    }
  }

  window.addEventListener("storage", onStorage);

  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function emitResidentsChange(): void {
  residentListeners.forEach((listener) => listener());
}

function emitSessionsChange(): void {
  sessionListeners.forEach((listener) => listener());
}

function getResidentsSnapshot(): Resident[] {
  const raw = localStorage.getItem(RESIDENTS_KEY);

  if (raw === residentsRawCache) {
    return residentsSnapshotCache;
  }

  residentsRawCache = raw;

  if (!raw) {
    residentsSnapshotCache = EMPTY_RESIDENTS;
    return residentsSnapshotCache;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    residentsSnapshotCache = Array.isArray(parsed)
      ? (parsed as Resident[])
      : EMPTY_RESIDENTS;
  } catch {
    residentsSnapshotCache = EMPTY_RESIDENTS;
  }

  return residentsSnapshotCache;
}

function getSessionsSnapshot(): GameSession[] {
  const raw = localStorage.getItem(SESSIONS_KEY);

  if (raw === sessionsRawCache) {
    return sessionsSnapshotCache;
  }

  sessionsRawCache = raw;

  if (!raw) {
    sessionsSnapshotCache = EMPTY_SESSIONS;
    return sessionsSnapshotCache;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const normalized = Array.isArray(parsed)
      ? parsed
          .map((item) => normalizeSession(item as Partial<GameSession>))
          .filter((session): session is GameSession => session !== null)
      : EMPTY_SESSIONS;
    sessionsSnapshotCache = normalized;
  } catch {
    sessionsSnapshotCache = EMPTY_SESSIONS;
  }

  return sessionsSnapshotCache;
}

function getResidentsServerSnapshot(): Resident[] {
  return EMPTY_RESIDENTS;
}

function getSessionsServerSnapshot(): GameSession[] {
  return EMPTY_SESSIONS;
}

export function useResidents() {
  const residents = useSyncExternalStore(
    subscribeResidents,
    getResidentsSnapshot,
    getResidentsServerSnapshot
  );

  function addResident(name: string): Resident {
    const resident: Resident = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = [...getResidentsSnapshot(), resident];
    save(RESIDENTS_KEY, next);
    emitResidentsChange();

    return resident;
  }

  function removeResident(id: string): void {
    const nextResidents = getResidentsSnapshot().filter((r) => r.id !== id);
    save(RESIDENTS_KEY, nextResidents);
    emitResidentsChange();

    const nextSessions = getSessionsSnapshot().filter((s) => s.residentId !== id);
    save(SESSIONS_KEY, nextSessions);
    emitSessionsChange();
  }

  function updateResident(id: string, name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const nextResidents = getResidentsSnapshot().map((resident) =>
      resident.id === id ? { ...resident, name: trimmed } : resident
    );
    save(RESIDENTS_KEY, nextResidents);
    emitResidentsChange();
    return true;
  }

  return { residents, addResident, removeResident, updateResident };
}

export function useSessions(residentId?: string) {
  const allSessions = useSyncExternalStore(
    subscribeSessions,
    getSessionsSnapshot,
    getSessionsServerSnapshot
  );

  const sessions = allSessions.filter((s) => {
    const residentMatch = residentId ? s.residentId === residentId : true;
    return residentMatch;
  });

  function getSessionsByGame(gameId?: GameId): GameSession[] {
    return gameId ? sessions.filter((s) => s.gameId === gameId) : sessions;
  }

  function addSession(
    residentIdValue: string,
    score: number,
    total: number,
    difficulty: Difficulty,
    gameId: GameId = "picture-memory"
  ): void {
    const session: GameSession = {
      id: crypto.randomUUID(),
      residentId: residentIdValue,
      date: new Date().toISOString(),
      gameId,
      score,
      total,
      difficulty,
    };

    const next = [...getSessionsSnapshot(), session];
    save(SESSIONS_KEY, next);
    emitSessionsChange();
  }

  return { sessions, addSession, getSessionsByGame };
}
