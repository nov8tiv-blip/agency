"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Stage {
  id: string;
  name: string;
  order: number;
  probability: number;
}

interface Deal {
  id: string;
  name: string;
  amount?: number;
  closeDate?: string;
  stageId: string;
  stage: Stage;
  company?: { name: string };
  owner: { name: string };
}

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        background: "white",
        border: "1px solid var(--hs-gray-mid)",
        borderRadius: 6,
        padding: "10px 12px",
        cursor: "grab",
        marginBottom: 8,
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--hs-text)" }}>{deal.name}</div>
      {deal.company && <div style={{ fontSize: 11, color: "var(--hs-text-light)", marginTop: 2 }}>{deal.company.name}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
        <span style={{ color: "var(--hs-green)", fontWeight: 600 }}>
          {deal.amount ? `$${Number(deal.amount).toLocaleString()}` : "—"}
        </span>
        {deal.closeDate && (
          <span style={{ color: "var(--hs-text-light)" }}>{new Date(deal.closeDate).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", stageId: "", closeDate: "" });
  const [pipelineId, setPipelineId] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/deals");
    const allDeals: Deal[] = await res.json();
    setDeals(allDeals);

    // Extract unique stages from deals
    const stageMap = new Map<string, Stage>();
    allDeals.forEach((d) => stageMap.set(d.stage.id, d.stage));
    if (allDeals[0]) setPipelineId((allDeals[0] as unknown as { pipelineId: string }).pipelineId);

    // If no deals, fetch pipeline stages from seed
    if (stageMap.size === 0) {
      // Try to get stages from first pipeline
      const pRes = await fetch("/api/deals/stages");
      if (pRes.ok) {
        const s: Stage[] = await pRes.json();
        s.forEach((st) => stageMap.set(st.id, st));
      }
    }
    setStages(Array.from(stageMap.values()).sort((a, b) => a.order - b.order));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    // over.id could be a stage column id or a deal id
    const targetStageId = stages.find((s) => s.id === over.id)?.id
      ?? deals.find((d) => d.id === over.id)?.stageId;

    if (!targetStageId) return;

    const deal = deals.find((d) => d.id === active.id);
    if (!deal || deal.stageId === targetStageId) return;

    setDeals((prev) =>
      prev.map((d) =>
        d.id === active.id
          ? { ...d, stageId: targetStageId, stage: stages.find((s) => s.id === targetStageId)! }
          : d
      )
    );

    await fetch(`/api/deals/${active.id}/stage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: targetStageId }),
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const stageId = form.stageId || stages[0]?.id;
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        amount: form.amount ? parseFloat(form.amount) : undefined,
        stageId,
        pipelineId: (pipelineId || stages[0]?.id) ?? "",
        closeDate: form.closeDate || undefined,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", amount: "", stageId: "", closeDate: "" });
      fetchData();
    }
  };

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  if (loading) return <div style={{ padding: 32, color: "var(--hs-text-light)" }}>Loading pipeline...</div>;

  return (
    <div>
      <PageHeader
        title="Deals Pipeline"
        action={
          <button onClick={() => setShowForm(true)} style={{ background: "var(--hs-orange)", color: "white", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            + Add Deal
          </button>
        }
      />

      <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }}>
          {stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stageId === stage.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
            return (
              <div
                key={stage.id}
                style={{ minWidth: 240, maxWidth: 240, display: "flex", flexDirection: "column" }}
              >
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--hs-text)" }}>{stage.name}</div>
                  <div style={{ fontSize: 11, color: "var(--hs-text-light)", marginTop: 2 }}>
                    {stageDeals.length} deal{stageDeals.length !== 1 ? "s" : ""} · ${stageTotal.toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.03)",
                    borderRadius: 8,
                    padding: 10,
                    minHeight: 200,
                    flex: 1,
                    border: "2px dashed transparent",
                  }}
                >
                  <SortableContext items={stageDeals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    {stageDeals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} onClick={() => router.push(`/deals/${deal.id}`)} />
                    ))}
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeDeal && (
            <div style={{ background: "white", border: "2px solid var(--hs-blue)", borderRadius: 6, padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{activeDeal.name}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 32, width: 460 }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18 }}>Add Deal</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Deal Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Amount ($)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Stage</label>
                <select value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }}>
                  {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Close Date</label>
                <input type="date" value={form.closeDate} onChange={(e) => setForm({ ...form, closeDate: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--hs-gray-mid)", background: "white", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "var(--hs-orange)", color: "white", fontWeight: 600, cursor: "pointer" }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
