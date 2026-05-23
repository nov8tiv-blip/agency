"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { ContactRecord } from "@/types/crm";

const LIFECYCLE_LABELS: Record<string, string> = {
  lead: "Lead",
  subscriber: "Subscriber",
  opportunity: "Opportunity",
  customer: "Customer",
  evangelist: "Evangelist",
};

const LIFECYCLE_COLORS: Record<string, string> = {
  lead: "#e5e8eb",
  subscriber: "#d6eaf8",
  opportunity: "#fdebd0",
  customer: "#d5f5e3",
  evangelist: "#e8daef",
};

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", jobTitle: "", lifecycleStage: "lead",
  });
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/contacts?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearch(q);
    fetchContacts(q);
  }, [searchParams, fetchContacts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(search ? `/contacts?q=${encodeURIComponent(search)}` : "/contacts");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "", lifecycleStage: "lead" });
      fetchContacts(search);
    }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader
        title={`Contacts (${total})`}
        action={
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: "var(--hs-orange)", color: "white", border: "none",
              borderRadius: 6, padding: "8px 18px", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
            }}
          >
            + Create Contact
          </button>
        }
      />

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{
            border: "1px solid var(--hs-gray-mid)", borderRadius: 6,
            padding: "7px 12px", fontSize: 13.5, width: 320, outline: "none",
          }}
        />
        <button type="submit" style={{ marginLeft: 8, padding: "7px 16px", borderRadius: 6, border: "1px solid var(--hs-gray-mid)", background: "white", cursor: "pointer", fontSize: 13 }}>
          Search
        </button>
      </form>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--hs-gray-light)", borderBottom: "1px solid var(--hs-gray-mid)" }}>
              {["Name", "Email", "Phone", "Company", "Lifecycle Stage", "Created"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "var(--hs-text-light)", letterSpacing: "0.03em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>Loading...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>No contacts found</td></tr>
            ) : contacts.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/contacts/${c.id}`)}
                style={{ borderBottom: "1px solid var(--hs-gray-mid)", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--hs-blue)", fontSize: 13.5 }}>
                  {c.firstName} {c.lastName}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13.5, color: "var(--hs-text-light)" }}>{c.email ?? "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 13.5, color: "var(--hs-text-light)" }}>{c.phone ?? "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 13.5 }}>{c.company?.name ?? "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: LIFECYCLE_COLORS[c.lifecycleStage] ?? "#e5e8eb",
                    borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                  }}>
                    {LIFECYCLE_LABELS[c.lifecycleStage] ?? c.lifecycleStage}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--hs-text-light)" }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 32, width: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18 }}>Create Contact</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {(["firstName", "lastName"] as const).map((f) => (
                  <div key={f}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--hs-text)", display: "block", marginBottom: 4 }}>
                      {f === "firstName" ? "First Name *" : "Last Name *"}
                    </label>
                    <input
                      required
                      value={form[f]}
                      onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                      style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                ))}
              </div>
              {(["email", "phone", "jobTitle"] as const).map((f) => (
                <div key={f}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--hs-text)", display: "block", marginBottom: 4 }}>
                    {f === "jobTitle" ? "Job Title" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </label>
                  <input
                    type={f === "email" ? "email" : "text"}
                    value={form[f]}
                    onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--hs-text)", display: "block", marginBottom: 4 }}>Lifecycle Stage</label>
                <select
                  value={form.lifecycleStage}
                  onChange={(e) => setForm({ ...form, lifecycleStage: e.target.value })}
                  style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }}
                >
                  {Object.entries(LIFECYCLE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--hs-gray-mid)", background: "white", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "var(--hs-orange)", color: "white", fontWeight: 600, cursor: "pointer" }}>
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
