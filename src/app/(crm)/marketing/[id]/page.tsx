"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  status: string;
  recipients: { id: string; email: string; status: string; contact?: { firstName: string; lastName: string } }[];
}

export default function CampaignBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", fromName: "", fromEmail: "", bodyHtml: "" });
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchCampaign = useCallback(async () => {
    const res = await fetch(`/api/marketing/campaigns/${id}`);
    const c: Campaign = await res.json();
    setCampaign(c);
    setForm({ name: c.name, subject: c.subject, fromName: c.fromName, fromEmail: c.fromEmail, bodyHtml: c.bodyHtml });
  }, [id]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/marketing/campaigns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
  };

  const addRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientEmail.trim()) return;
    await fetch(`/api/marketing/campaigns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipients: [...(campaign?.recipients ?? []).map((r) => ({ email: r.email, contactId: undefined })), { email: newRecipientEmail.trim() }],
      }),
    });
    setNewRecipientEmail("");
    fetchCampaign();
  };

  const importContacts = async () => {
    const res = await fetch("/api/contacts?limit=1000");
    const { contacts } = await res.json();
    const recipients = contacts
      .filter((c: { email?: string }) => c.email)
      .map((c: { id: string; email: string }) => ({ email: c.email, contactId: c.id }));
    await fetch(`/api/marketing/campaigns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients }),
    });
    fetchCampaign();
  };

  const send = async () => {
    await save();
    if (!confirm(`Send to ${campaign?.recipients.length} recipients? This cannot be undone.`)) return;
    setSending(true);
    const res = await fetch(`/api/marketing/campaigns/${id}/send`, { method: "POST" });
    if (res.ok) {
      alert("Campaign sending started!");
      fetchCampaign();
    }
    setSending(false);
  };

  if (!campaign) return <div style={{ padding: 32, color: "var(--hs-text-light)" }}>Loading...</div>;

  return (
    <div>
      <PageHeader
        title={form.name || "Campaign"}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => router.back()} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>← Back</button>
            <button onClick={() => router.push(`/marketing/${id}/analytics`)} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>📊 Analytics</button>
            <button onClick={save} disabled={saving} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>{saving ? "Saving..." : "Save"}</button>
            <button onClick={send} disabled={sending || campaign.status === "SENT"} style={{ background: campaign.status === "SENT" ? "#ccc" : "var(--hs-orange)", color: "white", border: "none", borderRadius: 6, padding: "7px 18px", fontWeight: 600, fontSize: 13, cursor: campaign.status === "SENT" ? "not-allowed" : "pointer" }}>
              {sending ? "Sending..." : campaign.status === "SENT" ? "Sent" : `Send to ${campaign.recipients.length}`}
            </button>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Campaign settings */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Campaign Settings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {([["name", "Campaign Name"], ["subject", "Email Subject *"], ["fromName", "From Name"], ["fromEmail", "From Email"]] as const).map(([f, label]) => (
                <div key={f}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
                  <input
                    value={form[f]}
                    onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    onBlur={save}
                    style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Email body */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Email Body (HTML)</h3>
            <p style={{ fontSize: 12, color: "var(--hs-text-light)", margin: "0 0 12px" }}>
              Use merge tags: <code>{"{{email}}"}</code>. HTML is fully supported.
            </p>
            <textarea
              value={form.bodyHtml}
              onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
              onBlur={save}
              rows={12}
              style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "10px 12px", fontSize: 13, fontFamily: "monospace", resize: "vertical" }}
            />
            <div style={{ marginTop: 12, padding: 12, background: "var(--hs-gray-light)", borderRadius: 6, fontSize: 12, color: "var(--hs-text-light)" }}>
              <strong>Preview:</strong>
              <div style={{ marginTop: 8, padding: 12, background: "white", border: "1px solid var(--hs-gray-mid)", borderRadius: 4, maxHeight: 200, overflow: "auto" }} dangerouslySetInnerHTML={{ __html: form.bodyHtml }} />
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20, height: "fit-content" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Recipients ({campaign.recipients.length})</h3>
          <form onSubmit={addRecipient} style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <input
              type="email"
              value={newRecipientEmail}
              onChange={(e) => setNewRecipientEmail(e.target.value)}
              placeholder="Add email..."
              style={{ flex: 1, border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "6px 8px", fontSize: 12 }}
            />
            <button type="submit" style={{ background: "var(--hs-blue)", color: "white", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>Add</button>
          </form>
          <button onClick={importContacts} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 0", fontSize: 12, cursor: "pointer", background: "var(--hs-gray-light)", marginBottom: 14 }}>
            Import All Contacts
          </button>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {campaign.recipients.map((r) => (
              <div key={r.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--hs-gray-mid)", fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>{r.contact ? `${r.contact.firstName} ${r.contact.lastName}` : r.email}</div>
                {r.contact && <div style={{ color: "var(--hs-text-light)" }}>{r.email}</div>}
                <div style={{ color: "var(--hs-text-light)", fontSize: 11 }}>{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
