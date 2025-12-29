"use client";

import { useCallback, useEffect, useState } from "react";

type Player = {
  id: string;
  codename: string;
  joinedAt: number;
  teamName?: string | null;
  teamIndex?: number | null;
};

type Session = {
  id: string;
  code: string;
  state: string;
  players: Player[];
};

export default function LobbyClient({ code }: { code: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  const loadSession = useCallback(async () => {
    setErr("");
    try {
      const r = await fetch(`/api/agency/session/${code}`, { cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to load session");
      setSession(data?.session ?? data); // supports either {session} or raw session
    } catch (e: any) {
      setErr(e?.message || "Failed to load session");
      setSession(null);
    }
  }, [code]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const assignTeams = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/agency/session/${code}/assign-teams`, {
        method: "POST",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to assign teams");
      await loadSession();
    } catch (e: any) {
      setErr(e?.message || "Failed to assign teams");
    } finally {
      setBusy(false);
    }
  };

  if (!session) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Lobby</h1>
        <div>{err ? `Error: ${err}` : "Loading lobby…"}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Session {session.code}</h1>
      <div style={{ marginBottom: 12, opacity: 0.7 }}>
        State: <b>{session.state}</b>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button onClick={loadSession} disabled={busy}>
          Refresh
        </button>

        <button onClick={assignTeams} disabled={busy}>
          {busy ? "Assigning…" : "Assign Teams"}
        </button>
      </div>

      {err ? <div style={{ marginBottom: 12 }}>⚠️ {err}</div> : null}

      <h3 style={{ marginTop: 0 }}>Players ({session.players.length})</h3>

      <div style={{ display: "grid", gap: 8 }}>
        {session.players.map((p) => (
          <div
            key={p.id}
            style={{
              padding: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{p.codename}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                Joined: {new Date(p.joinedAt).toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: "right", opacity: 0.8 }}>
              {p.teamName ? (
                <div>
                  Team: <b>{p.teamName}</b>
                  {typeof p.teamIndex === "number" ? ` (#${p.teamIndex + 1})` : ""}
                </div>
              ) : (
                <div>No team yet</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}