// src/lib/cases.ts

export type CaseDef = {
  id: string;
  title: string;
  difficulty: number; // 1–5
};

export const CASES: CaseDef[] = [
  { id: "cafe-caper", title: "The Café Caper", difficulty: 2 },
  { id: "midnight-missing", title: "Midnight Missing", difficulty: 3 },
  { id: "ledger-lies", title: "Ledger & Lies", difficulty: 4 },
];

// ✅ FIND CASE BY ID
export function getCaseById(id: string): CaseDef | null {
  return CASES.find(c => c.id === id) ?? null;
}

// ✅ DEFAULT CASE (auto-select)
export function getDefaultCaseId(): string | null {
  return CASES[0]?.id ?? null;
}
