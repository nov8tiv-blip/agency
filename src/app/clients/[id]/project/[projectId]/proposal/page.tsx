"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Input, Select, Textarea, Alert, Badge, Modal } from "@/components/ui";
import {
  getClient, getProject, saveProject, getProjectProposal, saveProposal,
  generateId, getSettings,
} from "@/lib/storage";
import { calculateMaterials, sumMaterials } from "@/lib/fencing/calculations";
import { sendProposalEmail, syncProjectToHubSpot, logEmailToHubSpot } from "@/lib/actions";
import type { Client, Project, Proposal, LineItem, MaterialItem } from "@/lib/types";

function nextProposalNumber(): string {
  const base = Date.now().toString().slice(-6);
  return `PRO-${base}`;
}

export default function ProposalPage() {
  const { id: clientId, projectId } = useParams<{ id: string; projectId: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [emailModal, setEmailModal] = useState(false);

  // Line item editing
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [taxRate, setTaxRate] = useState(8.25);
  const [depositPct, setDepositPct] = useState(50);
  const [validDays, setValidDays] = useState(30);
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [laborRate, setLaborRate] = useState(18);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  const buildFromMaterials = useCallback((mats: MaterialItem[], lr: number, project: Project) => {
    const items: LineItem[] = [];
    // Group materials by category
    const matItems: LineItem[] = mats.map(m => ({
      id: m.id,
      category: "materials" as const,
      description: m.description,
      quantity: m.quantity,
      unit: m.unit,
      unitPrice: m.unitCost,
      total: m.totalCost,
    }));
    items.push(...matItems);

    // Labor
    const totalLf = project.fencingSpec?.sections.reduce((s, sec) => s + sec.linearFeet, 0) || 0;
    if (totalLf > 0) {
      items.push({
        id: generateId(),
        category: "labor",
        description: "Fence Installation Labor",
        quantity: totalLf,
        unit: "lf",
        unitPrice: lr,
        total: totalLf * lr,
      });
    }

    // Removal labor
    if (project.fencingSpec?.existingRemoval && project.fencingSpec.removalFeet) {
      items.push({
        id: generateId(),
        category: "removal",
        description: "Existing Fence Removal & Disposal",
        quantity: project.fencingSpec.removalFeet,
        unit: "lf",
        unitPrice: 4.5,
        total: project.fencingSpec.removalFeet * 4.5,
      });
    }

    return items;
  }, []);

  useEffect(() => {
    const c = getClient(clientId);
    const p = getProject(projectId);
    if (!c || !p) { router.push("/clients"); return; }
    setClient(c);
    setProject(p);

    const settings = getSettings();
    setTaxRate(settings.proposal.defaultTaxRate);
    setDepositPct(settings.proposal.defaultDepositPercent);
    setValidDays(settings.proposal.defaultValidDays);
    setTerms(settings.proposal.defaultTerms);
    setLaborRate(settings.pricing.laborRatePerFoot);

    if (p.fencingSpec) {
      const mats = calculateMaterials(p.fencingSpec);
      setMaterials(mats);

      const existing = getProjectProposal(projectId);
      if (existing) {
        setProposal(existing);
        setLineItems(existing.lineItems);
        setTaxRate(existing.taxRate);
        setDepositPct(existing.depositPercent);
        setValidDays(existing.validDays);
        setTerms(existing.terms);
        setNotes(existing.notes || "");
      } else {
        const items = buildFromMaterials(mats, settings.pricing.laborRatePerFoot, p);
        setLineItems(items);
      }
    }
  }, [clientId, projectId, router, buildFromMaterials]);

  function recalc(items: LineItem[]): { subtotal: number; tax: number; total: number; deposit: number } {
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;
    const deposit = (total * depositPct) / 100;
    return { subtotal, tax, total, deposit };
  }

  function updateLineItem(id: string, key: keyof LineItem, value: unknown) {
    setLineItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [key]: value };
        if (key === "quantity" || key === "unitPrice") {
          updated.total = Math.round(updated.quantity * updated.unitPrice * 100) / 100;
        }
        return updated;
      })
    );
  }

  function addLineItem(category: LineItem["category"] = "misc") {
    setLineItems(prev => [...prev, {
      id: generateId(),
      category,
      description: "",
      quantity: 1,
      unit: "ea",
      unitPrice: 0,
      total: 0,
    }]);
  }

  function removeLineItem(id: string) {
    setLineItems(prev => prev.filter(i => i.id !== id));
  }

  function regenerateFromMaterials() {
    if (!project?.fencingSpec) return;
    const mats = calculateMaterials(project.fencingSpec);
    setMaterials(mats);
    const items = buildFromMaterials(mats, laborRate, project);
    setLineItems(items);
    showToast("Line items regenerated from fence specs.");
  }

  async function handleSave(status: Proposal["status"] = "draft") {
    if (!client || !project) return;
    setLoading(true);
    const { subtotal, tax, total, deposit } = recalc(lineItems);
    const now = new Date().toISOString();
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();

    const prop: Proposal = {
      id: proposal?.id || generateId(),
      projectId,
      clientId,
      proposalNumber: proposal?.proposalNumber || nextProposalNumber(),
      status,
      lineItems,
      subtotal,
      taxRate,
      taxAmount: tax,
      total,
      depositPercent: depositPct,
      depositAmount: deposit,
      validDays,
      validUntil,
      terms,
      notes: notes || undefined,
      createdAt: proposal?.createdAt || now,
      updatedAt: now,
      sentAt: status === "sent" ? now : proposal?.sentAt,
    };

    saveProposal(prop);
    setProposal(prop);

    const updatedProject = {
      ...project,
      status: (status === "sent" ? "proposal_sent" : status === "approved" ? "approved" : "proposal_draft") as Project["status"],
      updatedAt: now,
    };
    saveProject(updatedProject);
    setProject(updatedProject);

    setLoading(false);
    showToast("Proposal saved!");
    return prop;
  }

  async function handleSendEmail() {
    if (!client || !project) return;
    setLoading(true);
    const prop = await handleSave("sent");
    if (!prop) { setLoading(false); return; }

    const settings = getSettings();
    const emailRes = await sendProposalEmail(client, project, prop, settings);

    if (emailRes.ok) {
      // Log to HubSpot
      await logEmailToHubSpot(client, project, `Proposal #${prop.proposalNumber}`, `Proposal sent for $${prop.total.toFixed(2)}`, settings);
      showToast("Proposal emailed successfully!");
    } else {
      showToast(`Email error: ${emailRes.error}`);
    }
    setLoading(false);
    setEmailModal(false);
  }

  async function handleMarkApproved() {
    if (!client || !project) return;
    await handleSave("approved");
    const settings = getSettings();
    await syncProjectToHubSpot(client, { ...project, status: "approved" }, settings);
    showToast("Proposal marked as approved! HubSpot updated.");
    router.push(`/clients/${clientId}/project/${projectId}/materials`);
  }

  const { subtotal, tax, total, deposit } = recalc(lineItems);

  const CATEGORY_COLORS: Record<string, string> = {
    materials: "bg-blue-50",
    labor: "bg-green-50",
    removal: "bg-yellow-50",
    equipment: "bg-purple-50",
    permits: "bg-red-50",
    misc: "bg-gray-50",
  };

  if (!client || !project) return null;

  return (
    <AppLayout>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>
      )}

      <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:text-gray-700">Clients</Link>
        <span>/</span>
        <Link href={`/clients/${clientId}`} className="hover:text-gray-700">{client.firstName} {client.lastName}</Link>
        <span>/</span>
        <Link href={`/clients/${clientId}/project/${projectId}`} className="hover:text-gray-700">{project.name}</Link>
        <span>/</span>
        <span className="text-gray-900">Proposal</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Proposal {proposal?.proposalNumber ? `#${proposal.proposalNumber}` : ""}
          </h1>
          {proposal?.status && (
            <Badge color={{ draft: "gray", sent: "blue", viewed: "purple", approved: "green", declined: "red", expired: "red" }[proposal.status] as "gray" | "blue" | "green" | "red" | "purple"}>
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={regenerateFromMaterials}>Regenerate</Button>
          <Button variant="secondary" size="sm" onClick={() => handleSave("draft")} loading={loading}>Save Draft</Button>
          <Button variant="secondary" size="sm" onClick={() => setEmailModal(true)}>Email Proposal</Button>
          {proposal?.status === "sent" && (
            <Button variant="success" size="sm" onClick={handleMarkApproved}>Mark Approved</Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => window.print()}>Print / PDF</Button>
        </div>
      </div>

      {!project.fencingSpec && (
        <Alert type="warning" className="mb-4">
          No fence specifications found. <Link href={`/clients/${clientId}/project/${projectId}/fencing`} className="underline">Add fence specs</Link> first to auto-calculate materials.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line items */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Line Items"
            actions={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => addLineItem("materials")}>+ Material</Button>
                <Button size="sm" variant="secondary" onClick={() => addLineItem("labor")}>+ Labor</Button>
                <Button size="sm" variant="secondary" onClick={() => addLineItem("misc")}>+ Misc</Button>
              </div>
            }
          >
            <div className="overflow-x-auto -mx-6 px-6">
            <div className="space-y-1 min-w-[560px]">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase px-2 pb-1">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {lineItems.map((item) => (
                <div key={item.id} className={`grid grid-cols-12 gap-2 items-center rounded-lg p-2 ${CATEGORY_COLORS[item.category] || "bg-gray-50"}`}>
                  <div className="col-span-5">
                    <input
                      className="w-full bg-transparent text-sm border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-1"
                      value={item.description}
                      onChange={e => updateLineItem(item.id, "description", e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      className="w-full bg-transparent text-sm border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-1 text-right"
                      value={item.quantity}
                      onChange={e => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      className="w-full bg-transparent text-xs border-0 focus:outline-none text-gray-500"
                      value={item.unit}
                      onChange={e => updateLineItem(item.id, "unit", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-transparent text-sm border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-1 text-right"
                      value={item.unitPrice}
                      onChange={e => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1 text-right text-sm font-medium">
                    ${item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => removeLineItem(item.id)} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                  </div>
                </div>
              ))}

              {lineItems.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No line items. Click "+ Material" or "+ Labor" to add.
                </div>
              )}
            </div>
            </div>
          </Card>

          {/* Proposal settings */}
          <Card title="Proposal Settings">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Tax Rate (%)" type="number" step="0.25" min={0} value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} />
              <Input label="Deposit (%)" type="number" step={5} min={0} max={100} value={depositPct} onChange={e => setDepositPct(parseFloat(e.target.value) || 0)} />
              <Input label="Valid Days" type="number" min={1} value={validDays} onChange={e => setValidDays(parseInt(e.target.value) || 30)} />
              <Input label="Labor Rate ($/lf)" type="number" step={0.5} min={0} value={laborRate} onChange={e => setLaborRate(parseFloat(e.target.value) || 0)} />
            </div>
            <Textarea label="Terms & Conditions" value={terms} onChange={e => setTerms(e.target.value)} rows={4} className="mt-4" />
            <Textarea label="Notes to Client" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-4" placeholder="Optional notes included in the proposal..." />
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card title="Proposal Summary">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Client</span>
                <span className="font-medium">{client.firstName} {client.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fence Type</span>
                <span className="capitalize">{project.fencingSpec?.fenceType.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Linear Feet</span>
                <span>{project.fencingSpec?.sections.reduce((s, sec) => s + sec.linearFeet, 0) || 0} lf</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({taxRate}%)</span>
                <span>${tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span>${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Deposit ({depositPct}%)</span>
                <span className="font-semibold">${deposit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              {project.fencingSpec && total > 0 && (
                <div className="text-xs text-gray-400 pt-1">
                  ${(total / (project.fencingSpec.sections.reduce((s, sec) => s + sec.linearFeet, 0) || 1)).toFixed(2)}/lf installed
                </div>
              )}
            </div>

            <div className="space-y-2 mt-6">
              <Button className="w-full" onClick={() => handleSave("draft")} loading={loading}>
                Save Draft
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setEmailModal(true)}>
                Email to Client
              </Button>
              {proposal?.status === "sent" && (
                <Button variant="success" className="w-full" onClick={handleMarkApproved}>
                  Mark as Approved
                </Button>
              )}
              <Link href={`/clients/${clientId}/project/${projectId}/materials`}>
                <Button variant="secondary" className="w-full mt-2">
                  View Materials / PO
                </Button>
              </Link>
            </div>
          </Card>

          {/* Per-lf breakdown */}
          {materials.length > 0 && (
            <Card title="Material Cost Summary">
              <div className="space-y-2 text-xs">
                {Object.entries(
                  materials.reduce((acc, m) => {
                    acc[m.category] = (acc[m.category] || 0) + m.totalCost;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([cat, cost]) => (
                  <div key={cat} className="flex justify-between">
                    <span className="text-gray-500">{cat}</span>
                    <span className="font-medium">${cost.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-1 flex justify-between font-semibold">
                  <span>Total Materials</span>
                  <span>${sumMaterials(materials).toFixed(2)}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Email Modal */}
      <Modal open={emailModal} onClose={() => setEmailModal(false)} title="Send Proposal Email">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will email the proposal to <strong>{client.email || "(no email on file)"}</strong>.
            The email will include a summary of the proposal with total amount and deposit required.
          </p>
          {!client.email && (
            <Alert type="warning">Client has no email address. Please add one to their profile first.</Alert>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEmailModal(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} loading={loading} disabled={!client.email}>
              Send Email
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
