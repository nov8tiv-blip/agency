import type { FenceType } from "./types";

// Installed cost ranges per linear foot (materials + labor)
const FENCE_RATE: Record<FenceType, { min: number; max: number }> = {
  wood:       { min: 28, max: 48 },
  vinyl:      { min: 30, max: 55 },
  chain_link: { min: 15, max: 25 },
  iron:       { min: 45, max: 85 },
  aluminum:   { min: 35, max: 65 },
  composite:  { min: 40, max: 75 },
};

const GATE_RATE = { min: 250, max: 500 };
const REMOVAL_RATE = { min: 4, max: 8 };

export interface QuickEstimate {
  min: number;
  max: number;
}

export function estimateQuickQuote(
  fenceType: FenceType,
  linearFeet: number,
  gateCount: number,
  existingRemoval: boolean,
  removalFeet?: number
): QuickEstimate {
  const rate = FENCE_RATE[fenceType];
  const fenceMin = linearFeet * rate.min;
  const fenceMax = linearFeet * rate.max;
  const gateMin = gateCount * GATE_RATE.min;
  const gateMax = gateCount * GATE_RATE.max;
  const rft = existingRemoval ? (removalFeet ?? linearFeet) : 0;
  const removalMin = rft * REMOVAL_RATE.min;
  const removalMax = rft * REMOVAL_RATE.max;

  return {
    min: Math.round(fenceMin + gateMin + removalMin),
    max: Math.round(fenceMax + gateMax + removalMax),
  };
}

export const FENCE_TYPE_LABELS: Record<FenceType, string> = {
  wood:       "Wood",
  vinyl:      "Vinyl",
  chain_link: "Chain Link",
  iron:       "Wrought Iron",
  aluminum:   "Aluminum",
  composite:  "Composite",
};
