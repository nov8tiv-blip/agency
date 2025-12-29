"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codename, setCodename] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const c = code.trim().toUpperCase();
    const n = codename.trim();
    if (!c || !n) {
      setErr("Enter a code and your name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agency/session/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, codename: n }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data?.error || "Join failed.");
        return;
      }

      router.push(`/agency/lobby/${c}`);
    } catch (e) {
      setErr("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Join Session</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Enter the 5-character code and your codename.
      </p>

      <form onSubmit={onJoin} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ZEA5E"
            autoCapitalize="characters"
            style={{ padding: 12, fontSize: 16 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Codename</span>
          <input
            value={codename}
            onChange={(e) => setCodename(e.target.value)}
            placeholder="Mike"
            style={{ padding: 12, fontSize: 16 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Joining..." : "Join"}
        </button>

        {err && (
          <div
            style={{
              padding: 12,
              background: "#fee",
              border: "1px solid #f99",
              color: "#900",
            }}
          >
            {err}
          </div>
        )}
      </form>
    </main>
  );
}