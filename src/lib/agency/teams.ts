import type { Team, TeamPerk } from "./types";

export const NATO_TEAMS = [
  "ALPHA","BRAVO","CHARLIE","DELTA","ECHO","FOXTROT","GOLF","HOTEL","INDIA","JULIET",
];

function perkForTeamIndex(index: number, mode: string): TeamPerk {
  if (mode === "FAMILY") {
    const perks: TeamPerk[] = ["LEAD_HOUNDS", "PATTERN_SPOTTERS", "INTERROGATORS", "FORENSICS"];
    return perks[index % perks.length];
  }
  return "NONE";
}

export function assignTeamsRandomly(
  players: { id: string }[],
  teamCount: number,
  mode: string
): Team[] {
  const teams: Team[] = Array.from({ length: teamCount }, (_, i) => ({
    id: `team_${i + 1}`,
    name: NATO_TEAMS[i] ?? `TEAM_${i + 1}`,
    playerIds: [],
    perk: perkForTeamIndex(i, mode),
  }));

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  shuffled.forEach((p, idx) => teams[idx % teamCount].playerIds.push(p.id));

  return teams;
}
