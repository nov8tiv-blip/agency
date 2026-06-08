"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Input, Badge, Alert, Modal } from "@/components/ui";
import {
  getQuickQuote, saveQuickQuote, deleteQuickQuote, getSettings,
  saveClient, saveProject, generateId,
} from "@/lib/storage";
import { estimateQuickQuote, FENCE_TYPE_LABELS } from "@/lib/quote-estimator";
import { sendQuickQuoteEmail } from "@/lib/actions";
import type { FenceType, QuickQuote, QuickQuoteStatus, Client, Project } from "@/lib/types";

const FENCE_TYPES: FenceType[] = ["wood", "vinyl", "chain_link", "iron", "aluminum", "composite"];
const HEIGHTS = [4, 5, 6, 8];

const STATUS_COLOR: Record<QuickQuoteStatus, "gray" | "blue" | "green" | "red" | "yellow" | "purple"> = {
  new:       "blue",
  contacted: "yellow",
  converted: "green",
  lost:      "red",
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<QuickQuote | null>(null);
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [convertModal, setConvertModal] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [fenceType, setFenceType] = useState<FenceType>("wood");
  const [linearFeet, setLinearFeet] = useState(100);
  const [fenceHeight, setFenceHeight] = useState(6);
  const [gateCount, setGateCount] = useState(1);
  const [existingRemoval, setExistingRemoval] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<QuickQuoteStatus>("new");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  useEffect(() => {
    const q = getQuickQuote(id);
    if (!q) { router.push("/proposals"); return; }
    setQuote(q);
    setFirstName(q.firstName);
    setLastName(q.lastName);
    setEmail(q.email);
    setPhone(q.phone);
    setCity(q.city);
    setStateVal(q.state);
    setFenceType(q.fenceType);
    setLinearFeet(q.linearFeet);
    setFenceHeight(q.fenceHeight);
    setGateCount(q.gateCount);
    setExistingRemoval(q.existingRemoval);
    setNotes(q.notes || "");
    setStatus(q.status);
  }, [id, router]);

  function buildUpdated(): QuickQuote {
    const est = estimateQuickQuote(fenceType, linearFeet, gateCount, existingRemoval);
    return {
      ...quote!,
      firstName, lastName, email, phone, city, state: stateVal,
      fenceType, linearFeet, fenceHeight, gateCount, existingRemoval,
      removalFeet: existingRemoval ? linearFeet : undefined,
      estimateMin: est.min,
      estimateMax: est.max,
      notes: notes || undefined,
      status,
      updatedAt: new Date().toISOString(),
    };
  }

  function handleSave() {
    const updated = buildUpdated();
    saveQuickQuote(updated);
    setQuote(updated);
    showToast("Quote saved.");
  }

  async function handleResend() {
    if (!email) { showToast("No email address on file."); return; }
    setSending(true);
    const updated = buildUpdated();
    saveQuickQuote({ ...updated, sentAt: new Date().toISOString() });
    setQuote({ ...updated, sentAt: new Date().toISOString() });
    const settings = getSettings();
    const res = await sendQuickQuoteEmail(updated, settings);
    setSending(false);
    if (res.ok) {
      showToast("Estimate emailed successfully!");
    } else {
      showToast(`Email error: ${res.error}`);
    }
  }

  function handleConvertToClient() {
    const now = new Date().toISOString();
    const client: Client = {
      id: generateId(),
      firstName,
      lastName,
      email,
      phone,
      address: quote?.address || "",
      city,
      state: stateVal,
      zip: "",
      type: "residential",
      status: "lead",
      source: "quick_quote",
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
    };
    const project: Project = {
      id: generateId(),
      clientId: client.id,
      name: `${FENCE_TYPE_LABELS[fenceType]} Fence – ${linearFeet}lf`,
      status: "discovery",
      createdAt: now,
      updatedAt: now,
    };
    saveClient(client);
    saveProject(project);
    const updated = buildUpdated();
    saveQuickQuote({
      ...updated,
      status: "converted",
      convertedClientId: client.id,
      convertedProjectId: project.id,
    });
    router.push(`/clients/${client.id}`);
  }

  function handleDelete() {
    deleteQuickQuote(id);
    router.push("/proposals");
  }

  if (!quote) return null;

  const est = estimateQuickQuote(fenceType, linearFeet, gateCount, existingRemoval);

  return (
    <AppLayout>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link href="/proposals" className="hover:text-gray-700">Quick Quotes</Link>
        <span>/</span>
        <span className="text-gray-900">{quote.firstName} {quote.lastName}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{quote.firstName} {quote.lastName}</h1>
          <Badge color={STATUS_COLOR[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="secondary" size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" onClick={handleResend} loading={sending} disabled={!email}>
            Resend Estimate
          </Button>
          {quote.status !== "converted" && (
            <Button variant="success" size="sm" onClick={() => setConvertModal(true)}>
              Convert to Client
            </Button>
          )}
          {quote.convertedClientId && (
            <Link href={`/clients/${quote.convertedClientId}`}>
              <Button variant="secondary" size="sm">View in CRM</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: edit form */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Contact Info">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
              <Input label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <Input label="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              <Input label="City" value={city} onChange={e => setCity(e.target.value)} />
              <Input label="State" value={stateVal} onChange={e => setStateVal(e.target.value.toUpperCase())} maxLength={2} />
            </div>
          </Card>

          <Card title="Fence Details">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Fence Type</label>
              <div className="flex flex-wrap gap-2">
                {FENCE_TYPES.map(ft => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => setFenceType(ft)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      fenceType === ft
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {FENCE_TYPE_LABELS[ft]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Linear Feet: <span className="text-blue-600">{linearFeet}</span>
                </label>
                <input
                  type="range" min={10} max={1000} step={10}
                  value={linearFeet}
                  onChange={e => setLinearFeet(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Height</label>
                <div className="flex gap-1">
                  {HEIGHTS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setFenceHeight(h)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium border ${
                        fenceHeight === h ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-700"
                      }`}
                    >
                      {h}ft
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Gates: <span className="text-blue-600">{gateCount}</span>
                </label>
                <input
                  type="range" min={0} max={8} step={1}
                  value={gateCount}
                  onChange={e => setGateCount(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={existingRemoval}
                    onChange={e => setExistingRemoval(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">Remove existing</span>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes visible only to you…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </Card>
        </div>

        {/* Right: summary */}
        <div className="space-y-4">
          <Card title="Estimate">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ${est.min.toLocaleString()} – ${est.max.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mb-4">
              {FENCE_TYPE_LABELS[fenceType]} · {linearFeet} lf · {fenceHeight}ft
              {gateCount > 0 ? ` · ${gateCount} gate${gateCount > 1 ? "s" : ""}` : ""}
              {existingRemoval ? " · incl. removal" : ""}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as QuickQuoteStatus)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="space-y-2">
              <Button className="w-full" onClick={handleSave}>Save Changes</Button>
              <Button variant="secondary" className="w-full" onClick={handleResend} loading={sending} disabled={!email}>
                Resend Estimate Email
              </Button>
              {quote.status !== "converted" && (
                <Button variant="success" className="w-full" onClick={() => setConvertModal(true)}>
                  Convert to Client
                </Button>
              )}
            </div>
          </Card>

          <Card title="Info">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Source</span>
                <span className="capitalize">{quote.source.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted</span>
                <span>{new Date(quote.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              {quote.sentAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Sent</span>
                  <span className="text-green-600">{new Date(quote.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              )}
              {quote.convertedClientId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Client</span>
                  <Link href={`/clients/${quote.convertedClientId}`} className="text-blue-600 hover:underline text-xs">
                    View in CRM →
                  </Link>
                </div>
              )}
            </div>
          </Card>

          <button
            onClick={() => setDeleteModal(true)}
            className="text-xs text-red-400 hover:text-red-600 w-full text-center py-2"
          >
            Delete this quote
          </button>
        </div>
      </div>

      {/* Convert to Client Modal */}
      <Modal open={convertModal} onClose={() => setConvertModal(false)} title="Convert to Client">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create a new client and project for <strong>{firstName} {lastName}</strong> with status <em>Lead</em>, and redirect you to their CRM profile.
          </p>
          <Alert type="info">
            A project will be created with the fence details from this quick quote. You can refine it from the project page.
          </Alert>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConvertModal(false)}>Cancel</Button>
            <Button onClick={handleConvertToClient}>Convert &amp; Open in CRM</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Quote">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Permanently delete the quote for <strong>{quote.firstName} {quote.lastName}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
