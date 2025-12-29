"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  codename: string;
  joinedAt: number;
};

type Team = {
  id: string;
  name: string;
  color?: string;
  players: Player[];
};

type Session = {
  id: string;
  code: string;
  hostId: string;
  state: "LOBBY" | "IN_PROGRESS";
  createdAt: number;
  players: Player[];
  teams: any[]; // your store has teams:any[], we’ll safely display it
  settings: any;
};

export default function GameClient({ code }: { code: string }) {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // host detection (same idea as lobby)
  const [hostId, setHostId] = useState<string>("");

  const endpoint = useMemo(() => `/api/agency/session/${code}`, [code]);

  // read hostId from localStorage
  useEffect(() => {
    const key = `agency_host_${code}`;
    const saved = localStorage.getItem(key) || "";
    setHostId(saved);
  }, [code]);

  async function fetchSession() {
    try {
      setError("");
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setSession(null);
        setError(data?.error || "Failed to load session");
        return;
      }

      const s = data?.session ?? data;
      setSession(s);
    } catch (e: any) {
      setError(e?.message || "Network error");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  // poll session while on game screen
  useEffect(() => {
    if (!code) return;

    fetchSession();
    const id = setInterval(fetchSession, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // if somehow game state goes back, push them to lobby
  useEffect(() => {
    if (!session) return;
    if (session.state !== "IN_PROGRESS") {
      router.replace(`/agency/lobby/${code}`);
    }
  }, [session?.state, code, router, session]);

  const isHost = !!session && !!hostId && session.hostId === hostId;

  // normalize teams for display (supports your teams:any[])
  const teams: Team[] = Array.isArray(session?.teams)
    ? session!.teams.map((t: any, idx: number) => {
        const players: Player[] = Array.isArray(t?.players) ? t.players : [];
        return {
          id: String(t?.id ?? idx),
          name: String(t?.name ?? `Team ${idx + 1}`),
          color: t?.color,
          players,
        };
      })
    : [];

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Game Room</h1>
        <div style={{ fontSize: 13, opacity: 0.65 }}>
          Code: <strong>{code}</strong>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={fetchSession}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div style={{ marginTop: 16, opacity: 0.75 }}>Loading game…</div>}

      {error && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #f99", borderRadius: 12, background: "#fff5f5" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!!session && (
        <>
          {/* Status bar */}
          <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ padding: "8px 12px", border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.65 }}>State</div>
              <div style={{ fontWeight: 700 }}>{session.state}</div>
            </div>

            <div style={{ padding: "8px 12px", border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.65 }}>Players</div>
              <div style={{ fontWeight: 700 }}>{session.players?.length ?? 0}</div>
            </div>

            <div style={{ padding: "8px 12px", border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.65 }}>You</div>
              <div style={{ fontWeight: 700 }}>{isHost ? "HOST" : "PLAYER"}</div>
            </div>
          </div>

          {/* Layout: left = teams/players, right = round/evidence */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* LEFT: Teams / Players */}
            <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 700 }}>
                Teams
              </div>

              {teams.length === 0 ? (
                <div style={{ padding: 14, opacity: 0.7 }}>
                  No teams yet. (This is fine — we’ll add team building next.)
                </div>
              ) : (
                <div style={{ padding: 12, display: "grid", gap: 12 }}>
                  {teams.map((t) => (
                    <div key={t.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontWeight: 800 }}>{t.name}</div>
                        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.65 }}>
                          {t.players?.length ?? 0} players
                        </div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        {(t.players ?? []).length === 0 ? (
                          <div style={{ fontSize: 13, opacity: 0.7 }}>No one assigned</div>
                        ) : (
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {t.players.map((p) => (
                              <li key={p.id} style={{ margin: "6px 0" }}>
                                {p.codename}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Round / Evidence placeholder */}
            <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 700 }}>
                Round Control / Evidence
              </div>

              <div style={{ padding: 12, display: "grid", gap: 12 }}>
                <div style={{ padding: 12, border: "1px dashed #ddd", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>Timer</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>00:00</div>
                  <div style={{ fontSize: 13, opacity: 0.65, marginTop: 6 }}>
                    (Next step: real timer + phases.)
                  </div>
                </div>

                <div style={{ padding: 12, border: "1px dashed #ddd", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>Evidence</div>
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
                    Nothing yet. Next we’ll make “Drop Evidence” and show cards here.
                  </div>
                </div>

                {isHost ? (
                  <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Host Controls</div>

                    <button
                      onClick={() => alert("Next step: Start Round 1")}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1px solid #ddd",
                        background: "#fff",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Start Round 1 (next)
                    </button>

                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
                      We’ll wire this to a real API in the next step.
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12, opacity: 0.8 }}>
                    Waiting for the host to begin the round…
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Debug section */}
          <div style={{ marginTop: 16, fontSize: 12, opacity: 0.6 }}>
            Tip: open the lobby on another tab to confirm state stays IN_PROGRESS.
          </div>
        </>
      )}
    </div>
  );
}