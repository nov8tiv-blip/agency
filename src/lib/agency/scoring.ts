import type { ScoreCategory, TeamPerk } from "./types";

export type ScoreBreakdown = {
  base: number;
  multiplier: number;
  perkBonus: number; // how many points the perk added
  final: number;
  reason: string;
};

function perkMultiplier(perk: TeamPerk | undefined, category: ScoreCategory): number {
  if (!perk || perk === "NONE") return 1.0;

  // Strong bonus when perk matches the category
  if (perk === "LEAD_HOUNDS" && category === "LEADS") return 1.08;
  if (perk === "PATTERN_SPOTTERS" && category === "PATTERNS") return 1.08;
  if (perk === "INTERROGATORS" && category === "INTERROGATION") return 1.08;
  if (perk === "FORENSICS" && category === "FORENSICS") return 1.08;

  // Small bonus if perk is present but not perfectly aligned
  return 1.02;
}

export function applyTeamPerkScore(
  baseScore: number,
  perk: TeamPerk | undefined,
  category: ScoreCategory
): ScoreBreakdown {
  const multiplier = perkMultiplier(perk, category);
  const final = Math.round(baseScore * multiplier);
  const perkBonus = final - baseScore;

  const reason =
    perk && perk !== "NONE"
      ? perkBonus > 0
        ? `${perk} perk applied (${category})`
        : `${perk} perk present`
      : "No perk applied";

  return {
    base: baseScore,
    multiplier,
    perkBonus,
    final,
    reason,
  };
}

