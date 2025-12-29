export type SessionState = "LOBBY" | "IN_PROGRESS" | "FINISHED";

export type GameMode = "PARTY" | "FAMILY" | "DEEP" | "MASTER";
export type TeamMode = "RANDOM" | "COUPLES" | "MANUAL";
export type TimerPreset = "SHORT" | "NORMAL" | "LONG";
export type HolisMode = "OFF" | "ASSIST" | "WILDCARD" | "FOE";

export type TeamPerk =
  | "LEAD_HOUNDS"
  | "PATTERN_SPOTTERS"
  | "INTERROGATORS"
  | "FORENSICS"
  | "NONE";

export type ScoreCategory =
  | "LEADS"
  | "PATTERNS"
  | "INTERROGATION"
  | "FORENSICS"
  | "GENERAL";

export type SessionSettings = {
  mode: GameMode;
  teamMode: TeamMode;
  teamCount: number; // 2–10
  timers: TimerPreset;
  holis: HolisMode;
};

export type Player = {
  id: string;
  codename: string;
  teamId?: string; // optional (MANUAL/COUPLES can set this)
  joinedAt: number;
};

export type Team = {
  id: string;
  name: string;
  color?: string;
  playerIds: string[];
  perk?: TeamPerk;
};

export type Session = {
  id: string;
  code: string;
  hostId: string;
  state: SessionState;
  createdAt: number;
  players: Player[];
  teams: Team[];
  settings: SessionSettings;
};
