"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onCreate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agency/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Create failed");
        setLoading(false);
        return;
      }

      const code = data?.session?.code || data?.code;
      if (!code) {
        setError("No code returned");
        setLoading(false);
        return;
      }

      router.push(`/agency/lobby/${code}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>Create Session</h1>

      <button
        onClick={onCreate}
        disabled={loading}
        style={{
          marginTop: 16,
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "#fff",
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Creating…" : "Create Lobby"}
      </button>

      {error && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #f99", borderRadius: 12, background: "#fff5f5" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 13, opacity: 0.7 }}>
        This page calls <code>/api/agency/session/create</code> using POST and then sends you to the lobby.
      </div>
    </div>
  );
}