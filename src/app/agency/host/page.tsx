"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onCreate() {
    setLoading(true);
    const res = await fetch("/api/agency/session/create", { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) return alert("Failed to create session");
    router.push(`/agency/lobby/${data.code}`);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Host</h1>
      <button onClick={onCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Room"}
      </button>
    </div>
  );
}