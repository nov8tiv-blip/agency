"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();

  const [code, setCode] = useState("");
  const [codename, setCodename] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params?.code) {
      setCode(params.code);
    }
  }, [params]);

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const c = code.trim().toUpperCase();
    const n = codename.trim();

    if (!c || !n) {
      setErr("Enter a room code and your name.");
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
        setLoading(false);
        return;
      }

      router.push(`/agency/lobby/${c}`);
    } catch {
      setErr("Network error.");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Join Room</h1>

      <form onSubmit={onJoin}>
        <div>
          <label>Room Code</label>
          <br />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Your Name</label>
          <br />
          <input
            value={codename}
            onChange={(e) => setCodename(e.target.value)}
          />
        </div>

        {err && (
          <p style={{ color: "red", marginTop: 12 }}>
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 16 }}
        >
          {loading ? "Joining..." : "Join"}
        </button>
      </form>
    </div>
  );
}