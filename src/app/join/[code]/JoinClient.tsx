"use client";

import { useState } from "react";

export default function JoinClient({ code }: { code: string }) {
  const [codename, setCodename] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = codename.trim();
    if (!name) {
      setStatus("error");
      setError("Please enter a codename.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/agency/session/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, codename: name }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus("error");
        setError(data?.error || `Join failed (${res.status})`);
        return;
      }

      setStatus("success");
      // optional: you can route to /lobby/[code] later
      // for now we just show "Joined!"
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Network error");
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Join Game</h1>

      <div style={{ marginBottom: 12 }}>
        <strong>Room Code:</strong> {code}
      </div>

      <form onSubmit={onJoin}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Codename
          <input
            value={codename}
            onChange={(e) => setCodename(e.target.value)}
            placeholder="e.g. Mike"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            autoFocus
          />
        </label>

        <button
          type="submit"
          disabled={status === "loading"}
          style={{ padding: "10px 14px" }}
        >
          {status === "loading" ? "Joining..." : "Join"}
        </button>
      </form>

      {status === "success" && (
        <p style={{ marginTop: 14 }}>✅ Joined! (Next: we’ll show the lobby.)</p>
      )}

      {status === "error" && error && (
        <p style={{ marginTop: 14, color: "crimson" }}>❌ {error}</p>
      )}
    </main>
  );
}