import type { Player, Team } from "./types";

export function assignTeamsRandomly(players: Player[], teamCount = 2): Team[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const teams: Team[] = Array.from({ length: teamCount }).map((_, i) => ({
    id: `team_${i + 1}`,
    name: i === 0 ? "Alpha" : i === 1 ? "Bravo" : `Team ${i + 1}`,
    playerIds: [],
  }));

  shuffled.forEach((p, idx) => {
    teams[idx % teamCount].playerIds.push(p.id);
    p.teamId = teams[idx % teamCount].id;
  });

  return teams;
}