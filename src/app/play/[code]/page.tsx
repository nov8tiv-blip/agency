"use client";

import { useEffect, useMemo, useState } from "react";

type Session = {
  code: string;
  state: string;
  players: Array<{ id: string; codename: string }>;
};

export default function PlayPage({ params }: { params: { code: string } }) {
  const code = useMemo(() => (params.code || "").toUpperCase(), [params.code]);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    setError("");
    const res = await fetch(`/api/session/${code}`, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      setSession(null);
      setError(data?.error ?? "Failed to load session");
      return;
    }
    setSession(data.session);
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Pocket Detective (placeholder)</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Room</div>
          <div style={{ fontWeight: 800, letterSpacing: 2 }}>{code}</div>
        </div>
        <div style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>State</div>
          <div style={{ fontWeight: 700 }}>{session?.state ?? "…"}</div>
        </div>
      </div>

      {error ? (
        <div style={{ padding: 12, border: "1px solid #f2b8b5", borderRadius: 12 }}>
          <b>Error:</b> {error}
        </div>
      ) : null}

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>
          Players ({session?.players?.length ?? 0})
        </h2>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
          {(session?.players ?? []).map((p) => (
            <div key={p.id} style={{ padding: 12, borderTop: "1px solid #eee" }}>
              <b>{p.codename}</b>
            </div>
          ))}
        </div>
      </section>

      <p style={{ marginTop: 16, fontSize: 13, opacity: 0.75 }}>
        Next: this page becomes the real gamepad (evidence sorting, timer, actions).
      </p>
    </main>
  );
}