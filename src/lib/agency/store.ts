import type { Session, Player, SessionSettings } from "./types";
import { assignTeamsRandomly } from "./teams";

declare global {
  // eslint-disable-next-line no-var
  var __agencyStore:
    | {
        sessions: Map<string, Session>;
        codeToSessionId: Map<string, string>;
      }
    | undefined;
}

const store =
  globalThis.__agencyStore ??
  (globalThis.__agencyStore = {
    sessions: new Map<string, Session>(),
    codeToSessionId: new Map<string, string>(),
  });

const sessions = store.sessions; // keyed by sessionId
const codeToSessionId = store.codeToSessionId; // code -> sessionId

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 40;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function autoTeamCount(playerCount: number) {
  const targetPlayersPerTeam = 5;
  const raw = Math.ceil(playerCount / targetPlayersPerTeam);
  return clamp(raw, 2, 10);
}

function randCode(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function randId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultSettings(): SessionSettings {
  return {
    mode: "PARTY",
    teamMode: "RANDOM",
    teamCount: 2,
    timers: "NORMAL",
    holis: "OFF",
  };
}

function clampTeamCount(session: Session) {
  const n = session.players.length;

  return session.settings.teamCount && session.settings.teamCount >= 2
    ? clamp(session.settings.teamCount, 2, 10)
    : autoTeamCount(n);
}

export function createSession(): Session {
  const id = randId();

  let code = randCode();
  while (codeToSessionId.has(code)) code = randCode();

  const session: Session = {
    id,
    code,
    hostId: "", // host will be set by first join
    state: "LOBBY",
    createdAt: Date.now(),
    players: [],
    teams: [],
    settings: defaultSettings(),
  };

  sessions.set(id, session);
  codeToSessionId.set(code, id);
  return session;
}

export function getSessionById(id: string) {
  return sessions.get(id) ?? null;
}

export function getSessionByCode(codeRaw: string) {
  const code = (codeRaw || "").toUpperCase();
  const id = codeToSessionId.get(code);
  if (!id) return null;
  return getSessionById(id);
}

export function joinSession(codeRaw: string, codename: string) {
  const session = getSessionByCode(codeRaw);
  if (!session) return { session: null, player: null, isHost: false };

  if (session.players.length >= MAX_PLAYERS) {
    return { session: null, player: null, isHost: false };
  }

  const player: Player = { id: randId(), codename, joinedAt: Date.now() };

  // ✅ Host auto-detected by first join
  const isFirstPlayer = session.players.length === 0;
  if (isFirstPlayer) {
    session.hostId = player.id;
  }

  session.players.push(player);

  // Keep teams “live” in lobby only if RANDOM
  if (session.state === "LOBBY" && session.settings.teamMode === "RANDOM") {
    const teamCount = clampTeamCount(session);
    session.teams = assignTeamsRandomly(session.players, teamCount, session.settings.mode);
  }

  sessions.set(session.id, session);
  return { session, player, isHost: isFirstPlayer };
}

/**
 * ✅ SINGLE startSession: host-only + team assignment + state flip
 */
export function startSession(sessionId: string, hostId?: string) {
  const session = getSessionById(sessionId);
  if (!session) return { session: null, error: "Session not found" };

  const playerCount = session.players.length;
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    return { session: null, error: "Invalid player count" };
  }

  // Enforce host-only start if hostId provided
  if (hostId && session.hostId !== hostId) {
    return { session: null, error: "Only host can start" };
  }

  const teamCount =
    session.settings.teamMode === "RANDOM"
      ? clampTeamCount(session)
      : clamp(session.settings.teamCount ?? 2, 2, 10);

  session.teams = assignTeamsRandomly(session.players, teamCount, session.settings.mode);
  session.state = "IN_PROGRESS";

  sessions.set(sessionId, session);
  return { session, error: null };
}

export function updateSessionSettings(sessionId: string, patch: Partial<SessionSettings>) {
  const session = getSessionById(sessionId);
  if (!session) return null;

  // Lock settings once the game starts
  if (session.state !== "LOBBY") return session;

  session.settings = { ...session.settings, ...patch };

  // Re-shuffle in lobby only if RANDOM
  if (session.settings.teamMode === "RANDOM") {
    const teamCount = clampTeamCount(session);
    session.teams = assignTeamsRandomly(session.players, teamCount, session.settings.mode);
  }

  sessions.set(sessionId, session);
  return session;
}