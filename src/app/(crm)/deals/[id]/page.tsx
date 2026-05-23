"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";

const ACTIVITY_ICONS: Record<string, string> = {
  NOTE: "📝", CALL: "📞", EMAIL: "✉️", MEETING: "📅", TASK: "✅",
};

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActivity, setShowActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "NOTE", subject: "", body: "" });

  const fetchDeal = async () => {
    const res = await fetch(`/api/deals/${id}`);
    if (res.ok) setDeal(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchDeal(); }, [id]);

  const logActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...activityForm, dealId: id }),
    });
    setShowActivity(false);
    setActivityForm({ type: "NOTE", subject: "", body: "" });
    fetchDeal();
  };

  if (loading) return <div style={{ padding: 32, color: "var(--hs-text-light)" }}>Loading...</div>;
  if (!deal) return <div style={{ padding: 32 }}>Deal not found</div>;

  const d = deal as {
    id: string; name: string; amount?: number; closeDate?: string; probability?: number; lostReason?: string; createdAt: string;
    stage: { name: string; probability: number };
    company?: { id: string; name: string };
    owner: { name: string };
    contacts: { contact: { id: string; firstName: string; lastName: string; email?: string } }[];
    activities: { id: string; type: string; subject: string; body?: string; occurredAt: string; user: { name: string } }[];
    proposals: { id: string; title: string; status: string; total: number; createdAt: string }[];
  };

  return (
    <div>
      <PageHeader
        title={d.name}
        subtitle={d.company?.name}
        action={<button onClick={() => router.back()} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>← Back</button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        {/* Properties */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "var(--hs-text-light)", textTransform: "uppercase" }}>Deal Info</h3>
            {[
              ["Amount", d.amount ? `$${Number(d.amount).toLocaleString()}` : "—"],
              ["Stage", d.stage.name],
              ["Close Date", d.closeDate ? new Date(d.closeDate).toLocaleDateString() : "—"],
              ["Probability", `${d.probability ?? d.stage.probability}%`],
              ["Owner", d.owner.name],
            ].map(([label, value]) => (
              <div key={label as string} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--hs-text-light)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13.5 }}>{value}</div>
              </div>
            ))}
            <button
              onClick={() => router.push(`/proposals?dealId=${id}`)}
              style={{ width: "100%", background: "var(--hs-blue)", color: "white", border: "none", borderRadius: 6, padding: "8px 0", fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 8 }}
            >
              + Create Proposal
            </button>
          </div>

          {/* Associated contacts */}
          {d.contacts.length > 0 && (
            <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "var(--hs-text-light)", textTransform: "uppercase" }}>Contacts</h3>
              {d.contacts.map(({ contact: c }) => (
                <div key={c.id} onClick={() => router.push(`/contacts/${c.id}`)} style={{ marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--hs-blue)" }}>{c.firstName} {c.lastName}</div>
                  <div style={{ fontSize: 11, color: "var(--hs-text-light)" }}>{c.email ?? "—"}</div>
                </div>
              ))}
            </div>
          )}

          {/* Proposals */}
          {d.proposals.length > 0 && (
            <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "var(--hs-text-light)", textTransform: "uppercase" }}>Proposals</h3>
              {d.proposals.map((p) => (
                <div key={p.id} onClick={() => router.push(`/proposals/${p.id}`)} style={{ marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--hs-blue)" }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: "var(--hs-text-light)" }}>{p.status} · ${Number(p.total).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity timeline */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Activity</h3>
            <button onClick={() => setShowActivity(true)} style={{ background: "var(--hs-orange)", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              + Log Activity
            </button>
          </div>
          {d.activities.length === 0 ? (
            <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>
              No activities yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {d.activities.map((a) => (
                <div key={a.id} style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: "14px 18px", display: "flex", gap: 14 }}>
                  <div style={{ fontSize: 20 }}>{ACTIVITY_ICONS[a.type] ?? "📌"}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.subject}</div>
                    {a.body && <div style={{ color: "var(--hs-text-light)", fontSize: 13, marginTop: 4 }}>{a.body}</div>}
                    <div style={{ fontSize: 11, color: "var(--hs-text-light)", marginTop: 6 }}>{a.user.name} · {new Date(a.occurredAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showActivity && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 32, width: 460 }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18 }}>Log Activity</h2>
            <form onSubmit={logActivity} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
                <select value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }}>
                  {["NOTE", "CALL", "EMAIL", "MEETING", "TASK"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Subject *</label>
                <input required value={activityForm.subject} onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea rows={3} value={activityForm.body} onChange={(e) => setActivityForm({ ...activityForm, body: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowActivity(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--hs-gray-mid)", background: "white", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "var(--hs-orange)", color: "white", fontWeight: 600, cursor: "pointer" }}>Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
