"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TopBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/contacts?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header
      style={{
        height: 56,
        background: "white",
        borderBottom: "1px solid var(--hs-gray-mid)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 400 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts, companies, deals..."
          style={{
            width: "100%",
            border: "1px solid var(--hs-gray-mid)",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 13.5,
            color: "var(--hs-text)",
            background: "var(--hs-gray-light)",
            outline: "none",
          }}
        />
      </form>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--hs-text-light)",
            fontSize: 13,
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
