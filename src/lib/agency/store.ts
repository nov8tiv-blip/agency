import type { Session, Player } from "./types";
import { assignTeamsRandomly } from "./teams";

/**
 * DEV-ONLY in-memory store.
 * Note: Serverless instances are ephemeral (Vercel), so this is for dev/demo only.
 */
const sessions = new Map<string, Session>();
const codeToSessionId = new Map<string, string>();

function randCode(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function randId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSession(): Session {
  const id = randId();

  // avoid collisions
  let code = randCode();
  while (codeToSessionId.has(code)) code = randCode();

  const hostId = randId();

  const session: Session = {
    id,
    code,
    hostId,
    state: "LOBBY",
    createdAt: Date.now(),
    players: [],
  };

  sessions.set(id, session);
  codeToSessionId.set(code, id);
  return session;
}

export function getSessionById(id: string) {
  return sessions.get(id) ?? null;
}

export function getSessionByCode(code: string) {
  const id = codeToSessionId.get(code);
  if (!id) return null;
  return getSessionById(id);
}

export function joinSession(code: string, codename: string) {
  const session = getSessionByCode(code);
  if (!session) return { session: null, player: null };

  const player: Player = {
    id: randId(),
    codename,
    joinedAt: Date.now(),
  };

  session.players.push(player);
  sessions.set(session.id, session);
  return { session, player };
}

export function startSession(id: string, teamCount = 2) {
  const session = getSessionById(id);
  if (!session) return null;

  session.teams = assignTeamsRandomly(session.players, teamCount);
  session.state = "IN_PROGRESS";
  sessions.set(id, session);
  return session;
}