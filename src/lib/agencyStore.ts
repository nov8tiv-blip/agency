// src/lib/agencyStore.ts

export type Player = {
  id: string;
  codename: string;
  joinedAt: number;
};

export type Session = {
  code: string;
  createdAt: number;
  state: "LOBBY" | "IN_PROGRESS";
  players: Player[];
  caseId?: string; // ✅ added
};

const sessions = new Map<string, Session>();

export function createSession(code: string) {
  const c = code.trim().toUpperCase();
  const session: Session = {
    code: c,
    createdAt: Date.now(),
    state: "LOBBY",
    players: [],
    caseId: undefined,
  };
  sessions.set(c, session);
  return session;
}

export function getSession(
  code?: string,
  opts?: { createIfMissing?: boolean }
) {
  if (!code || typeof code !== "string") return null;

  const key = code.trim().toUpperCase();
  let session = sessions.get(key) || null;

  if (!session && opts?.createIfMissing) {
    session = createSession(key);
  }

  return session;
}

export function joinSession(code: string, codename: string) {
  const session = getSession(code, { createIfMissing: true });
  if (!session) return { error: "Session not found" as const };

  const player: Player = {
    id: crypto.randomUUID(),
    codename: codename.trim(),
    joinedAt: Date.now(),
  };

  session.players.push(player);
  return { session, player };
}

// ✅ NEW
export function setSessionCase(code: string, caseId: string) {
  const session = getSession(code, { createIfMissing: true });
  if (!session) return null;

  session.caseId = caseId.trim();
  return session;
}
