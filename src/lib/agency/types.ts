export type SessionState = "LOBBY" | "IN_PROGRESS" | "ENDED";

export type Player = {
  id: string;
  codename: string;
  teamId?: string;
  joinedAt: number;
};

export type Team = {
  id: string;
  name: string;
  color?: string;
  playerIds: string[];
};

export type Session = {
  id: string;
  code: string;
  hostId: string;
  state: SessionState;
  createdAt: number;
  players: Player[];
  teams?: Team[];
};