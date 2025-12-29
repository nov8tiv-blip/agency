import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function autoTeamCount(playerCount: number) {
  const targetPlayersPerTeam = 5;
  return Math.max(2, Math.ceil(playerCount / targetPlayersPerTeam));
}

export async function POST(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = (params.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const { data: session, error: sErr } = await supabase
    .from("agency_sessions")
    .select("id, code")
    .eq("code", code)
    .maybeSingle();

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { data: players, error: pErr } = await supabase
  .from("agency_players")
  .select("id, codename, joined_at, team_index, team_name")
  .eq("session_id", session.id);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const playerIds = (players ?? []).map((p) => p.id);
  const count = playerIds.length;
  if (count < 2) {
    return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 });
  }

  const teamCount = autoTeamCount(count);
  const shuffled = shuffle(playerIds);

  const updates = shuffled.map((id, idx) => {
    const teamIndex = idx % teamCount;
    return {
      id,
      team_index: teamIndex,
      team_name: `Team ${teamIndex + 1}`,
    };
  });

  const { error: uErr } = await supabase.from("agency_players").upsert(updates);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    code,
    teamCount,
    playerCount: count,
  });
}