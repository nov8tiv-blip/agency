"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codename, setCodename] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/agency/session/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, codename }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to join");
      setLoading(false);
      return;
    }

    router.push(`/lobby/${data.session.id}`);
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Join Session</h1>

      <form onSubmit={submit}>
        <input
          placeholder="Session Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
        />
        <br />

        <input
          placeholder="Codename"
          value={codename}
          onChange={(e) => setCodename(e.target.value)}
          required
        />
        <br />

        <button disabled={loading}>
          {loading ? "Joining…" : "Join"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}