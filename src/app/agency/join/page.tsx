"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleJoin() {
    setError("");

    const res = await fetch("/api/agency/session/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code.toUpperCase(),
        codename: name,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Join failed");
      return;
    }

    // SUCCESS → go to lobby
    router.push(`/agency/lobby/${code.toUpperCase()}`);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Join Game</h1>

      <div>
        <input
          placeholder="Game Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <div>
        <input
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <button onClick={handleJoin}>Join</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}