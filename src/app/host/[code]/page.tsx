"use client";

import { useEffect, useMemo, useState } from "react";

type Player = { id: string; codename: string; joinedAt: number };

type Team = { id: string; name: string; playerIds: string[] };

type Session = {
  id: string;
  code: string;
  state: "LOBBY" | "IN_PROGRESS" | string;
  players: Player[];
  teams: Team[];
  settings?: { teamCount?: number; mode?: string; teamMode?: string };
};

export default function HostLobbyPage({ params }: { params: { code: string } }) {
  const code = useMemo(() => (params.code || "").toUpperCase(), [params.code]);

  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string>("");
  const [starting, setStarting] = useState(false);

  function teamNameForPlayer(s: Session | null, playerId: string) {
    const team = s?.teams?.find((t) => t.playerIds.includes(playerId));
    return team?.name ?? null;
  }

  async function refresh() {
    if (!code) return;
    setError("");

    try {
      const res = await fetch(`/api/session/${code}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setSession(null);
        setError(data?.error ?? "Failed to load session");
        return;
      }

      setSession(data.session);
    } catch (e) {
      setSession(null);
      setError("Network error loading session");
    }
  }
  useEffect(() => {
  let alive = true;

  async function tick() {
    try {
      const res = await fetch(`/api/agency/session/${code}`, { cache: "no-store" });
      const data = await res.json();
      if (!alive) return;

      if (res.ok) {
        setSession(data.session);
      } else {
        setError(data?.error || "Failed to load session");
      }
    } catch {
      if (!alive) return;
      setError("Network error");
    }
  }

  tick();
  const id = setInterval(tick, 1000);
  return () => {
    alive = false;
    clearInterval(id);
  };
}, [code]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function startGame() {
    if (!session) return;

    setStarting(true);
    setError("");

    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          // optional override; server can ignore or clamp
          teamCount: session.settings?.teamCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStarting(false);
        setError(data?.error ?? "Failed to start session");
        return;
      }

      setSession(data.session);
      setStarting(false);
    } catch (e) {
      setStarting(false);
      setError("Network error starting session");
    }
  }

  const playerCount = session?.players?.length ?? 0;

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Host Lobby</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <div style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Room Code</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{code}</div>
        </div>

        <div style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>State</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{session?.state ?? "…"}</div>
        </div>

        <div style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Players</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{playerCount}</div>
        </div>
      </div>

      {error ? (
        <div style={{ padding: 12, border: "1px solid #f2b8b5", borderRadius: 10 }}>
          <b>Error:</b> {error}
        </div>
      ) : null}

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Players ({playerCount})</h2>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
          {(session?.players ?? []).length === 0 ? (
            <div style={{ padding: 12, opacity: 0.7 }}>
              Nobody joined yet. Share the code: <b>{code}</b>
            </div>
          ) : (
            (session?.players ?? []).map((p, idx) => {
              const teamName = teamNameForPlayer(session, p.id);
              return (
                <div
                  key={p.id}
                  style={{
                    padding: 12,
                    borderTop: idx === 0 ? "none" : "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{p.codename}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {teamName ? `Team: ${teamName}` : "No team yet"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button
          onClick={startGame}
          disabled={!session || starting || playerCount < 2}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #111",
            cursor: !session || starting || playerCount < 2 ? "not-allowed" : "pointer",
            fontWeight: 700,
            opacity: !session || starting || playerCount < 2 ? 0.6 : 1,
          }}
        >
          {starting ? "Starting…" : "Start Game"}
        </button>

        <button
          onClick={refresh}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Refresh
        </button>
      </section>

      <p style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>
        Next we’ll add a Join page so friends can enter a codename and hop in.
      </p>
    </main>
  );
}
