"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Input, Alert, Badge } from "@/components/ui";
import { getClient, getProject, generateId } from "@/lib/storage";
import { calculateMaterials, sumMaterials } from "@/lib/fencing/calculations";
import type { Client, Project, MaterialItem, PurchaseOrder } from "@/lib/types";

export default function MaterialsPage() {
  const { id: clientId, projectId } = useParams<{ id: string; projectId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [supplier, setSupplier] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poStatus, setPoStatus] = useState<PurchaseOrder["status"]>("draft");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const c = getClient(clientId);
    const p = getProject(projectId);
    if (!c || !p) { router.push("/clients"); return; }
    setClient(c);
    setProject(p);
    if (p.fencingSpec) {
      setMaterials(calculateMaterials(p.fencingSpec));
    }
  }, [clientId, projectId, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  function updateItem(id: string, key: keyof MaterialItem, value: unknown) {
    setMaterials(prev =>
      prev.map(m => {
        if (m.id !== id) return m;
        const updated = { ...m, [key]: value };
        if (key === "quantity" || key === "unitCost") {
          updated.totalCost = Math.round(updated.quantity * updated.unitCost * 100) / 100;
        }
        return updated;
      })
    );
  }

  function handlePrint() {
    window.print();
  }

  function handleExportCSV() {
    const headers = ["Category", "Description", "SKU", "Qty", "Unit", "Unit Cost", "Total Cost", "Supplier"];
    const rows = materials.map(m => [
      m.category,
      `"${m.description}"`,
      m.sku || "",
      m.quantity,
      m.unit,
      m.unitCost.toFixed(2),
      m.totalCost.toFixed(2),
      m.supplier || "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `materials-${project?.name || projectId}.csv`;
    a.click();
    showToast("CSV downloaded.");
  }

  function handleCopyPO() {
    if (!materials.length || !project) return;
    const lines = [
      `PURCHASE ORDER`,
      `Project: ${project.name}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Supplier: ${supplier || "TBD"}`,
      ``,
      `QTY  UNIT  DESCRIPTION                            UNIT COST   TOTAL`,
      `---  ----  -------------------------------------  ---------   -----`,
      ...materials.map(m =>
        `${String(m.quantity).padEnd(5)} ${m.unit.padEnd(6)} ${m.description.slice(0, 37).padEnd(37)} $${m.unitCost.toFixed(2).padStart(9)} $${m.totalCost.toFixed(2).padStart(9)}`
      ),
      ``,
      `SUBTOTAL: $${sumMaterials(materials).toFixed(2)}`,
      poNotes ? `Notes: ${poNotes}` : "",
    ].filter(l => l !== undefined).join("\n");

    navigator.clipboard.writeText(lines).then(() => showToast("PO copied to clipboard!"));
  }

  if (!client || !project) return null;

  const grouped = materials.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, MaterialItem[]>);

  const total = sumMaterials(materials);
  const spec = project.fencingSpec;
  const totalLf = spec?.sections.reduce((s, sec) => s + sec.linearFeet, 0) || 0;

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
        <span className="text-gray-900">Materials</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials & Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-1">
            {spec ? `${spec.fenceType.replace("_", " ")} — ${totalLf} lf` : "No fence specs"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>Export CSV</Button>
          <Button variant="secondary" size="sm" onClick={handleCopyPO}>Copy PO Text</Button>
          <Button variant="secondary" size="sm" onClick={handlePrint}>Print</Button>
        </div>
      </div>

      {!spec && (
        <Alert type="warning">
          No fence specifications. <Link href={`/clients/${clientId}/project/${projectId}/fencing`} className="underline">Add fence specs</Link> first.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material list */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category} title={category}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase">
                      <th className="text-left py-1 font-semibold w-1/2">Description</th>
                      <th className="text-right py-1 font-semibold">Qty</th>
                      <th className="text-left py-1 font-semibold px-2">Unit</th>
                      <th className="text-right py-1 font-semibold">Unit Cost</th>
                      <th className="text-right py-1 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-2">
                          <input
                            className="w-full text-sm bg-transparent focus:outline-none focus:bg-white focus:border-b focus:border-blue-300"
                            value={item.description}
                            onChange={e => updateItem(item.id, "description", e.target.value)}
                          />
                        </td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            className="w-16 text-right text-sm bg-transparent focus:outline-none focus:bg-white focus:border-b focus:border-blue-300"
                            value={item.quantity}
                            onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-2 px-2 text-gray-500">{item.unit}</td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="w-20 text-right text-sm bg-transparent focus:outline-none focus:bg-white focus:border-b focus:border-blue-300"
                            value={item.unitCost}
                            onChange={e => updateItem(item.id, "unitCost", parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-2 text-right font-medium">
                          ${item.totalCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold text-xs text-gray-500 border-t border-gray-200">
                      <td colSpan={4} className="py-2">Category Total</td>
                      <td className="py-2 text-right">${items.reduce((s, i) => s + i.totalCost, 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary & PO */}
        <div className="space-y-4">
          <Card title="Cost Summary">
            <div className="space-y-2 text-sm">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="flex justify-between">
                  <span className="text-gray-500 capitalize">{cat}</span>
                  <span>${items.reduce((s, i) => s + i.totalCost, 0).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>Total Materials</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {totalLf > 0 && (
                <div className="text-xs text-gray-400">
                  ${(total / totalLf).toFixed(2)}/lf material cost
                </div>
              )}
            </div>
          </Card>

          <Card title="Purchase Order">
            <div className="space-y-3">
              <Input
                label="Supplier Name"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="e.g. Home Depot Pro, ABC Fence Supply"
              />
              <Input
                label="Supplier Email"
                type="email"
                value={supplierEmail}
                onChange={e => setSupplierEmail(e.target.value)}
                placeholder="orders@supplier.com"
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">PO Notes</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  rows={3}
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  placeholder="Delivery instructions, account number, special requests..."
                />
              </div>

              <div className="pt-2 space-y-2">
                <Button className="w-full" onClick={handleCopyPO}>Copy PO to Clipboard</Button>
                <Button variant="secondary" className="w-full" onClick={handleExportCSV}>Download CSV</Button>
                {supplierEmail && (
                  <a
                    href={`mailto:${supplierEmail}?subject=Purchase Order - ${project.name}&body=${encodeURIComponent(`Dear Supplier,\n\nPlease find attached our purchase order for:\nProject: ${project.name}\nClient: ${client.firstName} ${client.lastName}\n\nPlease confirm receipt and availability.\n\nThank you!`)}`}
                    className="block"
                  >
                    <Button variant="secondary" className="w-full">Email Supplier</Button>
                  </a>
                )}
              </div>
            </div>
          </Card>

          <Card title="Navigation">
            <div className="space-y-2">
              <Link href={`/clients/${clientId}/project/${projectId}/proposal`}>
                <Button variant="secondary" className="w-full" size="sm">Back to Proposal</Button>
              </Link>
              <Link href={`/clients/${clientId}/project/${projectId}`}>
                <Button variant="secondary" className="w-full" size="sm">Project Overview</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
