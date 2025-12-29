"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCaseById } from "@/lib/cases";

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = React.use(params);

  const router = useRouter();
  const sp = useSearchParams();

  const code = (sp.get("code") || "").trim().toUpperCase();
  const gameCase = useMemo(() => getCaseById(caseId), [caseId]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!gameCase) {
    return (
      <div style={{ padding: 24 }}>
        <div>Case not found</div>
        <Link href={code ? `/cases?code=${code}` : "/cases"}>← Back to cases</Link>
      </div>
    );
  }

  const onSelect = async () => {
    if (!code) {
      setErr("Missing session code. Use /cases?code=HELLO1");
      return;
    }
    setBusy(true);
    setErr("");

    try {
      const res = await fetch(`/api/agency/session/${code}/case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: gameCase.id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to set case");

      router.push(`/lobby?code=${code}`);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>{gameCase.title}</h1>
      <p>Difficulty: {gameCase.difficulty}/5</p>

      {code ? (
        <>
          <button onClick={onSelect} disabled={busy}>
            {busy ? "Selecting..." : "Select this case (auto) →"}
          </button>
          <div style={{ marginTop: 12, opacity: 0.7 }}>
            Session: <b>{code}</b>
          </div>
        </>
      ) : (
        <div style={{ opacity: 0.7 }}>
          No session code found. Go back and open <code>/cases?code=HELLO1</code>.
        </div>
      )}

      {err ? <p style={{ marginTop: 12 }}>{err}</p> : null}

      <div style={{ marginTop: 24 }}>
        <Link href={code ? `/cases?code=${code}` : "/cases"}>← Back to cases</Link>
      </div>
    </div>
  );
}