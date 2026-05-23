"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";

const ACTIVITY_ICONS: Record<string, string> = {
  NOTE: "📝", CALL: "📞", EMAIL: "✉️", MEETING: "📅", TASK: "✅",
};

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [contact, setContact] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showActivity, setShowActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "NOTE", subject: "", body: "" });

  const fetchContact = async () => {
    const res = await fetch(`/api/contacts/${id}`);
    if (res.ok) setContact(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchContact(); }, [id]);

  const saveField = async (field: string, value: string) => {
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) setContact(await res.json());
    setEditing(null);
  };

  const logActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/contacts/${id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activityForm),
    });
    if (res.ok) {
      setShowActivity(false);
      setActivityForm({ type: "NOTE", subject: "", body: "" });
      fetchContact();
    }
  };

  if (loading) return <div style={{ padding: 32, color: "var(--hs-text-light)" }}>Loading...</div>;
  if (!contact) return <div style={{ padding: 32 }}>Contact not found</div>;

  const c = contact as {
    firstName: string; lastName: string; email?: string; phone?: string;
    jobTitle?: string; lifecycleStage: string; createdAt: string;
    company?: { name: string }; activities?: unknown[]; deals?: unknown[];
  };

  const fields = [
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "jobTitle", label: "Job Title" },
    { key: "lifecycleStage", label: "Lifecycle Stage" },
  ];

  return (
    <div>
      <PageHeader
        title={`${c.firstName} ${c.lastName}`}
        subtitle={c.company ? (c.company as { name: string }).name : undefined}
        action={
          <button onClick={() => router.back()} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>
            ← Back
          </button>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        {/* Properties panel */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20, height: "fit-content" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "var(--hs-text-light)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Contact Info</h3>
          {fields.map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--hs-text-light)", marginBottom: 3 }}>{label}</div>
              {editing === key ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveField(key, editValue)}
                    style={{ flex: 1, border: "1px solid var(--hs-blue)", borderRadius: 4, padding: "4px 8px", fontSize: 13 }}
                  />
                  <button onClick={() => saveField(key, editValue)} style={{ background: "var(--hs-blue)", color: "white", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>✓</button>
                  <button onClick={() => setEditing(null)} style={{ background: "none", border: "1px solid var(--hs-gray-mid)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>✗</button>
                </div>
              ) : (
                <div
                  onClick={() => { setEditing(key); setEditValue((c as unknown as Record<string, string>)[key] ?? ""); }}
                  style={{ fontSize: 13.5, color: (c as unknown as Record<string, string>)[key] ? "var(--hs-text)" : "var(--hs-text-light)", cursor: "pointer", padding: "2px 4px", borderRadius: 4, minHeight: 22 }}
                  title="Click to edit"
                >
                  {(c as unknown as Record<string, string>)[key] ?? "—"}
                </div>
              )}
            </div>
          ))}
          <div style={{ fontSize: 11, color: "var(--hs-text-light)", marginTop: 16 }}>
            Created {new Date(c.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Activity timeline */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Activity</h3>
            <button
              onClick={() => setShowActivity(true)}
              style={{ background: "var(--hs-orange)", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              + Log Activity
            </button>
          </div>

          {((c.activities as unknown[]) ?? []).length === 0 ? (
            <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>
              No activities yet. Log a call, note, or email to get started.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {((c.activities as unknown[]) ?? []).map((a) => {
                const act = a as { id: string; type: string; subject: string; body?: string; occurredAt: string; user: { name: string } };
                return (
                  <div key={act.id} style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: "14px 18px", display: "flex", gap: 14 }}>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{ACTIVITY_ICONS[act.type] ?? "📌"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{act.subject}</div>
                      {act.body && <div style={{ color: "var(--hs-text-light)", fontSize: 13, marginTop: 4 }}>{act.body}</div>}
                      <div style={{ fontSize: 11, color: "var(--hs-text-light)", marginTop: 6 }}>
                        {act.user.name} · {new Date(act.occurredAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Log Activity Modal */}
      {showActivity && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 32, width: 460, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18 }}>Log Activity</h2>
            <form onSubmit={logActivity} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
                <select value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }}>
                  {["NOTE", "CALL", "EMAIL", "MEETING", "TASK"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
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
