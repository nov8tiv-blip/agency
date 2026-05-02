"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Input, Select, Textarea, Alert } from "@/components/ui";
import { getClient, getProject, saveProject, generateId } from "@/lib/storage";
import type {
  Client,
  Project,
  FenceType,
  FenceSection,
  GateSpec,
  WoodFenceSpec,
  VinylFenceSpec,
  ChainLinkFenceSpec,
  IronFenceSpec,
  AluminumFenceSpec,
  CompositeFenceSpec,
  FencingSpec,
} from "@/lib/types";

const FENCE_TYPES: { type: FenceType; label: string; desc: string; icon: string }[] = [
  { type: "wood", label: "Wood", desc: "Pine, Cedar, Redwood, Pressure-Treated", icon: "🪵" },
  { type: "vinyl", label: "Vinyl", desc: "Low-maintenance PVC panels & posts", icon: "🤍" },
  { type: "chain_link", label: "Chain Link", desc: "Galvanized or vinyl-coated wire mesh", icon: "⛓️" },
  { type: "iron", label: "Wrought Iron", desc: "Ornamental wrought iron panels", icon: "🔩" },
  { type: "aluminum", label: "Aluminum", desc: "Lightweight ornamental aluminum", icon: "🔷" },
  { type: "composite", label: "Composite", desc: "Wood-look composite boards & aluminum frame", icon: "🏗️" },
];

const DEFAULT_SECTION: Omit<FenceSection, "id"> = {
  label: "Section 1",
  linearFeet: 0,
  height: 6,
  terrain: "flat",
};

const DEFAULT_GATE: Omit<GateSpec, "id"> = {
  type: "walk",
  width: 4,
  height: 6,
  autoOperator: false,
  hardware: "standard",
  quantity: 1,
};

export default function FencingSpecPage() {
  const { id: clientId, projectId } = useParams<{ id: string; projectId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const [fenceType, setFenceType] = useState<FenceType>("wood");
  const [sections, setSections] = useState<FenceSection[]>([{ ...DEFAULT_SECTION, id: generateId() }]);
  const [gates, setGates] = useState<GateSpec[]>([]);
  const [existingRemoval, setExistingRemoval] = useState(false);
  const [removalFeet, setRemovalFeet] = useState(0);

  // Wood-specific
  const [woodStyle, setWoodStyle] = useState<WoodFenceSpec["style"]>("privacy");
  const [woodSpecies, setWoodSpecies] = useState<WoodFenceSpec["woodSpecies"]>("pressure_treated");
  const [picketWidth, setPicketWidth] = useState<3.5 | 5.5>(5.5);
  const [picketSpacing, setPicketSpacing] = useState(0);
  const [postSpacing, setPostSpacing] = useState<6 | 7 | 8>(8);
  const [postSize, setPostSize] = useState<"4x4" | "6x6">("4x4");
  const [railCount, setRailCount] = useState<2 | 3>(2);
  const [addLattice, setAddLattice] = useState(false);
  const [addStain, setAddStain] = useState(false);
  const [stainColor, setStainColor] = useState("");
  const [addPostCaps, setAddPostCaps] = useState(false);
  const [postCapStyle, setPostCapStyle] = useState<WoodFenceSpec["postCapStyle"]>("flat");

  // Vinyl-specific
  const [vinylStyle, setVinylStyle] = useState<VinylFenceSpec["style"]>("privacy");
  const [vinylColor, setVinylColor] = useState<VinylFenceSpec["color"]>("white");
  const [panelWidth, setPanelWidth] = useState<6 | 8>(8);
  const [foamFill, setFoamFill] = useState(false);
  const [vinylCapStyle, setVinylCapStyle] = useState<VinylFenceSpec["postCapStyle"]>("flat");

  // Chain link
  const [clGauge, setClGauge] = useState<ChainLinkFenceSpec["gauge"]>(11);
  const [meshOpening, setMeshOpening] = useState<2 | 2.25>(2);
  const [clCoating, setClCoating] = useState<ChainLinkFenceSpec["coating"]>("galvanized");
  const [addTopRail, setAddTopRail] = useState(true);
  const [addBottomRail, setAddBottomRail] = useState(false);
  const [addBarbedWire, setAddBarbedWire] = useState(false);
  const [barbedStrands, setBarbedStrands] = useState<1 | 2 | 3>(1);
  const [privacySlats, setPrivacySlats] = useState<ChainLinkFenceSpec["privacySlats"]>("none");

  // Iron
  const [ironStyle, setIronStyle] = useState<IronFenceSpec["style"]>("spear_top");
  const [ironPicketSpacing, setIronPicketSpacing] = useState<3.5 | 4>(4);
  const [ironRailCount, setIronRailCount] = useState<2 | 3>(2);
  const [ironPanelWidth, setIronPanelWidth] = useState<4 | 6>(4);
  const [ironFinish, setIronFinish] = useState<IronFenceSpec["finish"]>("black");
  const [addScrolls, setAddScrolls] = useState(false);
  const [addRings, setAddRings] = useState(false);
  const [addFleurDeLis, setAddFleurDeLis] = useState(false);

  // Aluminum
  const [alStyle, setAlStyle] = useState<AluminumFenceSpec["style"]>("flat_top");
  const [alGrade, setAlGrade] = useState<AluminumFenceSpec["grade"]>("residential");
  const [alPanelWidth, setAlPanelWidth] = useState<4 | 6>(4);
  const [alPicketSize, setAlPicketSize] = useState<AluminumFenceSpec["picketSize"]>("5/8\"");
  const [alColor, setAlColor] = useState<AluminumFenceSpec["color"]>("black");
  const [poolCode, setPoolCode] = useState(false);

  // Composite
  const [compStyle, setCompStyle] = useState<CompositeFenceSpec["style"]>("privacy");
  const [boardWidth, setBoardWidth] = useState<4 | 5.5 | 6>(6);
  const [boardOrientation, setBoardOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [compColor, setCompColor] = useState("");
  const [compPostSpacing, setCompPostSpacing] = useState<6 | 8>(8);
  const [postType, setPostType] = useState<CompositeFenceSpec["postType"]>("aluminum_sleeve");
  const [boardGap, setBoardGap] = useState(0);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = getClient(clientId);
    const p = getProject(projectId);
    if (!c || !p) { router.push("/clients"); return; }
    setClient(c);
    setProject(p);

    if (p.fencingSpec) {
      const spec = p.fencingSpec;
      setFenceType(spec.fenceType);
      setSections(spec.sections);
      setGates(spec.gates);
      setExistingRemoval(spec.existingRemoval);
      setRemovalFeet(spec.removalFeet || 0);
    }
  }, [clientId, projectId, router]);

  function addSection() {
    const n = sections.length + 1;
    setSections([...sections, { ...DEFAULT_SECTION, id: generateId(), label: `Section ${n}` }]);
  }

  function removeSection(id: string) {
    setSections(sections.filter((s) => s.id !== id));
  }

  function updateSection(id: string, key: keyof FenceSection, value: unknown) {
    setSections(sections.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  }

  function addGate() {
    setGates([...gates, { ...DEFAULT_GATE, id: generateId() }]);
  }

  function removeGate(id: string) {
    setGates(gates.filter((g) => g.id !== id));
  }

  function updateGate(id: string, key: keyof GateSpec, value: unknown) {
    setGates(gates.map((g) => (g.id === id ? { ...g, [key]: value } : g)));
  }

  function buildSpec(): FencingSpec {
    const base = { sections, gates, existingRemoval, removalFeet: existingRemoval ? removalFeet : undefined };
    switch (fenceType) {
      case "wood":
        return { fenceType: "wood", style: woodStyle, woodSpecies, picketWidth, picketSpacing, postSpacing, postSize, railCount, addLattice, addStain, stainColor, addPostCaps, postCapStyle, ...base } as WoodFenceSpec;
      case "vinyl":
        return { fenceType: "vinyl", style: vinylStyle, color: vinylColor, panelWidth, addFoamFillPosts: foamFill, postCapStyle: vinylCapStyle, ...base } as VinylFenceSpec;
      case "chain_link":
        return { fenceType: "chain_link", gauge: clGauge, meshOpening, coating: clCoating, linePostSpacing: 10, addTopRail, addBottomRail, addBarbedWire, barbedWireStrands: addBarbedWire ? barbedStrands : undefined, privacySlats, ...base } as ChainLinkFenceSpec;
      case "iron":
        return { fenceType: "iron", style: ironStyle, picketSpacing: ironPicketSpacing, railCount: ironRailCount, panelWidth: ironPanelWidth, finish: ironFinish, addScrolls, addRings, addFleurDeLis, surfaceMount: false, ...base } as IronFenceSpec;
      case "aluminum":
        return { fenceType: "aluminum", style: alStyle, grade: alGrade, panelWidth: alPanelWidth, picketSize: alPicketSize, color: alColor, poolCode, ...base } as AluminumFenceSpec;
      case "composite":
        return { fenceType: "composite", style: compStyle, boardWidth, boardOrientation, color: compColor, postSpacing: compPostSpacing, postType, boardGap, ...base } as CompositeFenceSpec;
    }
  }

  async function handleSave() {
    if (!project) return;
    setSaving(true);
    const spec = buildSpec();
    const updated: Project = {
      ...project,
      fencingSpec: spec,
      status: project.status === "discovery" ? "measuring" : project.status,
      updatedAt: new Date().toISOString(),
    };
    saveProject(updated);
    setSaving(false);
    router.push(`/clients/${clientId}/project/${projectId}/proposal`);
  }

  if (!client || !project) return null;

  const totalLf = sections.reduce((s, sec) => s + (sec.linearFeet || 0), 0);

  return (
    <AppLayout>
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:text-gray-700">Clients</Link>
        <span>/</span>
        <Link href={`/clients/${clientId}`} className="hover:text-gray-700">{client.firstName} {client.lastName}</Link>
        <span>/</span>
        <Link href={`/clients/${clientId}/project/${projectId}`} className="hover:text-gray-700">{project.name}</Link>
        <span>/</span>
        <span className="text-gray-900">Fence Specs</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Fence Specifications</h1>

      {/* Fence Type Selector */}
      <Card title="Fence Type" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {FENCE_TYPES.map((ft) => (
            <button
              key={ft.type}
              onClick={() => setFenceType(ft.type)}
              className={`flex flex-col items-center p-3 rounded-xl border-2 text-center transition-colors ${
                fenceType === ft.type ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl mb-1">{ft.icon}</span>
              <span className={`text-sm font-semibold ${fenceType === ft.type ? "text-blue-700" : "text-gray-700"}`}>{ft.label}</span>
              <span className="text-xs text-gray-400 mt-0.5">{ft.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Type-specific options */}
      <Card title={`${FENCE_TYPES.find(f => f.type === fenceType)?.label} Options`} className="mb-6">
        {fenceType === "wood" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select label="Style" value={woodStyle} onChange={e => setWoodStyle(e.target.value as typeof woodStyle)} options={[
              { value: "privacy", label: "Privacy (solid)" },
              { value: "shadowbox", label: "Shadowbox" },
              { value: "board_on_board", label: "Board-on-Board" },
              { value: "picket", label: "Picket" },
              { value: "split_rail", label: "Split Rail" },
              { value: "lattice_top", label: "Privacy w/ Lattice Top" },
            ]} />
            <Select label="Wood Species" value={woodSpecies} onChange={e => setWoodSpecies(e.target.value as typeof woodSpecies)} options={[
              { value: "pressure_treated", label: "Pressure-Treated Pine" },
              { value: "cedar", label: "Cedar" },
              { value: "pine", label: "Pine (untreated)" },
              { value: "redwood", label: "Redwood" },
            ]} />
            <Select label="Post Spacing" value={postSpacing} onChange={e => setPostSpacing(Number(e.target.value) as 6 | 7 | 8)} options={[
              { value: 6, label: "6 feet" },
              { value: 7, label: "7 feet" },
              { value: 8, label: "8 feet (standard)" },
            ]} />
            <Select label="Post Size" value={postSize} onChange={e => setPostSize(e.target.value as "4x4" | "6x6")} options={[
              { value: "4x4", label: "4x4 (standard)" },
              { value: "6x6", label: "6x6 (heavy duty)" },
            ]} />
            <Select label="Picket Width" value={picketWidth} onChange={e => setPicketWidth(Number(e.target.value) as 3.5 | 5.5)} options={[
              { value: 5.5, label: '1x6 (5½" wide)' },
              { value: 3.5, label: '1x4 (3½" wide)' },
            ]} />
            <Select label="Rails" value={railCount} onChange={e => setRailCount(Number(e.target.value) as 2 | 3)} options={[
              { value: 2, label: "2 Rails (up to 5')" },
              { value: 3, label: "3 Rails (6'+ / heavy)" },
            ]} />
            <Input label="Picket Spacing (inches)" type="number" min={0} max={6} step={0.5} value={picketSpacing} onChange={e => setPicketSpacing(Number(e.target.value))} hint="0 = privacy/solid" />
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-700">Add-ons</label>
              {[
                { label: "Add Stain / Sealer", checked: addStain, onChange: setAddStain },
                { label: "Post Caps", checked: addPostCaps, onChange: setAddPostCaps },
                { label: "Lattice Top", checked: addLattice, onChange: setAddLattice },
              ].map(opt => (
                <label key={opt.label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={opt.checked} onChange={e => opt.onChange(e.target.checked)} className="rounded" />
                  {opt.label}
                </label>
              ))}
            </div>
            {addStain && <Input label="Stain Color" value={stainColor} onChange={e => setStainColor(e.target.value)} placeholder="e.g. Cabot Natural Cedar" />}
            {addPostCaps && <Select label="Post Cap Style" value={postCapStyle} onChange={e => setPostCapStyle(e.target.value as typeof postCapStyle)} options={[
              { value: "flat", label: "Flat" },
              { value: "dog_ear", label: "Dog Ear" },
              { value: "gothic", label: "Gothic / Pointed" },
              { value: "ball", label: "Ball" },
              { value: "pyramid", label: "Pyramid" },
            ]} />}
          </div>
        )}

        {fenceType === "vinyl" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select label="Style" value={vinylStyle} onChange={e => setVinylStyle(e.target.value as typeof vinylStyle)} options={[
              { value: "privacy", label: "Privacy (solid)" },
              { value: "semi_privacy", label: "Semi-Privacy" },
              { value: "shadowbox", label: "Shadowbox" },
              { value: "picket", label: "Picket" },
              { value: "ranch_3rail", label: "Ranch (3 Rail)" },
              { value: "ranch_2rail", label: "Ranch (2 Rail)" },
            ]} />
            <Select label="Color" value={vinylColor} onChange={e => setVinylColor(e.target.value as typeof vinylColor)} options={[
              { value: "white", label: "White" },
              { value: "tan", label: "Tan / Beige" },
              { value: "gray", label: "Gray" },
              { value: "clay", label: "Clay" },
              { value: "woodgrain_cedar", label: "Woodgrain Cedar" },
              { value: "woodgrain_walnut", label: "Woodgrain Walnut" },
            ]} />
            <Select label="Panel Width" value={panelWidth} onChange={e => setPanelWidth(Number(e.target.value) as 6 | 8)} options={[
              { value: 6, label: "6 feet wide" },
              { value: 8, label: "8 feet wide (standard)" },
            ]} />
            <Select label="Post Cap Style" value={vinylCapStyle} onChange={e => setVinylCapStyle(e.target.value as typeof vinylCapStyle)} options={[
              { value: "flat", label: "Flat" },
              { value: "french_gothic", label: "French Gothic" },
              { value: "gothic", label: "Gothic" },
              { value: "ball", label: "Ball" },
              { value: "pyramid", label: "Pyramid" },
            ]} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={foamFill} onChange={e => setFoamFill(e.target.checked)} className="rounded" />
              Foam-fill posts (reduces vibration)
            </label>
          </div>
        )}

        {fenceType === "chain_link" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select label="Wire Gauge" value={clGauge} onChange={e => setClGauge(Number(e.target.value) as typeof clGauge)} options={[
              { value: 9, label: "9 Gauge (heavy)" },
              { value: 11, label: "11 Gauge (standard)" },
              { value: 11.5, label: "11.5 Gauge (light)" },
            ]} />
            <Select label="Mesh Opening" value={meshOpening} onChange={e => setMeshOpening(Number(e.target.value) as 2 | 2.25)} options={[
              { value: 2, label: '2" standard' },
              { value: 2.25, label: '2¼" (kennel)' },
            ]} />
            <Select label="Coating" value={clCoating} onChange={e => setClCoating(e.target.value as typeof clCoating)} options={[
              { value: "galvanized", label: "Galvanized (silver)" },
              { value: "black_vinyl", label: "Black Vinyl Coated" },
              { value: "green_vinyl", label: "Green Vinyl Coated" },
              { value: "brown_vinyl", label: "Brown Vinyl Coated" },
            ]} />
            <Select label="Privacy Slats" value={privacySlats} onChange={e => setPrivacySlats(e.target.value as typeof privacySlats)} options={[
              { value: "none", label: "None" },
              { value: "black", label: "Black" },
              { value: "green", label: "Green" },
              { value: "brown", label: "Brown" },
              { value: "gray", label: "Gray" },
              { value: "white", label: "White" },
            ]} />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Rails & Options</label>
              {[
                { label: "Top Rail", checked: addTopRail, onChange: setAddTopRail },
                { label: "Bottom Rail (vs tension wire)", checked: addBottomRail, onChange: setAddBottomRail },
                { label: "Barbed Wire on Top", checked: addBarbedWire, onChange: setAddBarbedWire },
              ].map(opt => (
                <label key={opt.label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={opt.checked} onChange={e => opt.onChange(e.target.checked)} className="rounded" />
                  {opt.label}
                </label>
              ))}
            </div>
            {addBarbedWire && <Select label="Barbed Wire Strands" value={barbedStrands} onChange={e => setBarbedStrands(Number(e.target.value) as 1 | 2 | 3)} options={[
              { value: 1, label: "1 Strand" },
              { value: 2, label: "2 Strands" },
              { value: 3, label: "3 Strands" },
            ]} />}
          </div>
        )}

        {fenceType === "iron" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select label="Style" value={ironStyle} onChange={e => setIronStyle(e.target.value as typeof ironStyle)} options={[
              { value: "spear_top", label: "Spear Top (classic)" },
              { value: "flat_top", label: "Flat Top" },
              { value: "gothic", label: "Gothic Arch" },
              { value: "ring_top", label: "Ring Top" },
              { value: "finial_top", label: "Finial Top" },
              { value: "custom", label: "Custom" },
            ]} />
            <Select label="Panel Width" value={ironPanelWidth} onChange={e => setIronPanelWidth(Number(e.target.value) as 4 | 6)} options={[
              { value: 4, label: "4 feet wide" },
              { value: 6, label: "6 feet wide" },
            ]} />
            <Select label="Finish Color" value={ironFinish} onChange={e => setIronFinish(e.target.value as typeof ironFinish)} options={[
              { value: "black", label: "Gloss Black" },
              { value: "bronze", label: "Oil-Rubbed Bronze" },
              { value: "silver", label: "Satin Silver" },
              { value: "hunter_green", label: "Hunter Green" },
              { value: "custom", label: "Custom Color" },
            ]} />
            <Select label="Picket Spacing" value={ironPicketSpacing} onChange={e => setIronPicketSpacing(Number(e.target.value) as 3.5 | 4)} options={[
              { value: 3.5, label: '3½" spacing' },
              { value: 4, label: '4" spacing (standard)' },
            ]} />
            <Select label="Rails" value={ironRailCount} onChange={e => setIronRailCount(Number(e.target.value) as 2 | 3)} options={[
              { value: 2, label: "2 Rails (up to 4')" },
              { value: 3, label: "3 Rails (4'+ or heavy)" },
            ]} />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Decorative Options</label>
              {[
                { label: "Decorative Scrolls", checked: addScrolls, onChange: setAddScrolls },
                { label: "Rings / Circles", checked: addRings, onChange: setAddRings },
                { label: "Fleur-de-Lis", checked: addFleurDeLis, onChange: setAddFleurDeLis },
              ].map(opt => (
                <label key={opt.label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={opt.checked} onChange={e => opt.onChange(e.target.checked)} className="rounded" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {fenceType === "aluminum" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select label="Style" value={alStyle} onChange={e => setAlStyle(e.target.value as typeof alStyle)} options={[
              { value: "flat_top", label: "Flat Top" },
              { value: "spear_top", label: "Spear Top" },
              { value: "pool_code", label: "Pool Code / Safety" },
              { value: "classic", label: "Classic" },
              { value: "contemporary", label: "Contemporary" },
              { value: "puppy_picket", label: "Puppy Picket (2\" spacing)" },
            ]} />
            <Select label="Grade" value={alGrade} onChange={e => setAlGrade(e.target.value as typeof alGrade)} options={[
              { value: "residential", label: "Residential" },
              { value: "commercial", label: "Commercial" },
              { value: "industrial", label: "Industrial" },
            ]} />
            <Select label="Color" value={alColor} onChange={e => setAlColor(e.target.value as typeof alColor)} options={[
              { value: "black", label: "Gloss Black" },
              { value: "bronze", label: "Bronze" },
              { value: "white", label: "White" },
              { value: "hunter_green", label: "Hunter Green" },
              { value: "silver", label: "Silver" },
            ]} />
            <Select label="Panel Width" value={alPanelWidth} onChange={e => setAlPanelWidth(Number(e.target.value) as 4 | 6)} options={[
              { value: 4, label: "4 feet wide" },
              { value: 6, label: "6 feet wide" },
            ]} />
            <Select label="Picket Size" value={alPicketSize} onChange={e => setAlPicketSize(e.target.value as typeof alPicketSize)} options={[
              { value: '5/8"', label: '5/8" standard' },
              { value: '3/4"', label: '3/4" commercial' },
              { value: '1"', label: '1" industrial' },
            ]} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={poolCode} onChange={e => setPoolCode(e.target.checked)} className="rounded" />
              Pool barrier code compliant
            </label>
          </div>
        )}

        {fenceType === "composite" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select label="Style" value={compStyle} onChange={e => setCompStyle(e.target.value as typeof compStyle)} options={[
              { value: "privacy", label: "Privacy (solid)" },
              { value: "semi_privacy", label: "Semi-Privacy" },
              { value: "horizontal_board", label: "Modern Horizontal" },
            ]} />
            <Select label="Board Orientation" value={boardOrientation} onChange={e => setBoardOrientation(e.target.value as "horizontal" | "vertical")} options={[
              { value: "horizontal", label: "Horizontal" },
              { value: "vertical", label: "Vertical" },
            ]} />
            <Select label="Board Width" value={boardWidth} onChange={e => setBoardWidth(Number(e.target.value) as 4 | 5.5 | 6)} options={[
              { value: 4, label: '4" wide board' },
              { value: 5.5, label: '5½" wide board' },
              { value: 6, label: '6" wide board' },
            ]} />
            <Input label="Color / Product" value={compColor} onChange={e => setCompColor(e.target.value)} placeholder="e.g. Trex Clam Shell, TimberTech Dark Roast" hint="Brand and color name" />
            <Select label="Post Spacing" value={compPostSpacing} onChange={e => setCompPostSpacing(Number(e.target.value) as 6 | 8)} options={[
              { value: 6, label: "6 feet" },
              { value: 8, label: "8 feet" },
            ]} />
            <Select label="Post Type" value={postType} onChange={e => setPostType(e.target.value as typeof postType)} options={[
              { value: "aluminum_sleeve", label: "Aluminum Sleeve over Wood" },
              { value: "all_aluminum", label: "All-Aluminum Post" },
              { value: "wood_with_sleeve", label: "Wood Post w/ Composite Sleeve" },
            ]} />
            <Input label="Board Gap (inches)" type="number" min={0} max={4} step={0.25} value={boardGap} onChange={e => setBoardGap(Number(e.target.value))} hint="0 = privacy/no gap" />
          </div>
        )}
      </Card>

      {/* Sections */}
      <Card
        title={`Fence Sections — Total: ${totalLf} lf`}
        actions={<Button size="sm" variant="secondary" onClick={addSection}>+ Add Section</Button>}
        className="mb-6"
      >
        <div className="space-y-4">
          {sections.map((sec, i) => (
            <div key={sec.id} className="border border-gray-200 rounded-lg p-4 relative">
              {sections.length > 1 && (
                <button
                  onClick={() => removeSection(sec.id)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm"
                >✕</button>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input
                  label="Section Name"
                  value={sec.label}
                  onChange={e => updateSection(sec.id, "label", e.target.value)}
                  placeholder={`Section ${i + 1}`}
                />
                <Input
                  label="Linear Feet *"
                  type="number"
                  min={0}
                  step={0.5}
                  value={sec.linearFeet || ""}
                  onChange={e => updateSection(sec.id, "linearFeet", parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
                <Select
                  label="Height"
                  value={sec.height}
                  onChange={e => updateSection(sec.id, "height", Number(e.target.value))}
                  options={[
                    { value: 3, label: "3 feet" },
                    { value: 4, label: "4 feet" },
                    { value: 5, label: "5 feet" },
                    { value: 6, label: "6 feet (standard)" },
                    { value: 8, label: "8 feet" },
                    { value: 10, label: "10 feet" },
                    { value: 12, label: "12 feet" },
                  ]}
                />
                <Select
                  label="Terrain"
                  value={sec.terrain}
                  onChange={e => updateSection(sec.id, "terrain", e.target.value)}
                  options={[
                    { value: "flat", label: "Flat" },
                    { value: "slight_slope", label: "Slight Slope" },
                    { value: "moderate_slope", label: "Moderate Slope" },
                    { value: "steep", label: "Steep" },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Gates */}
      <Card
        title="Gates"
        actions={<Button size="sm" variant="secondary" onClick={addGate}>+ Add Gate</Button>}
        className="mb-6"
      >
        {gates.length === 0 ? (
          <p className="text-sm text-gray-400">No gates added. Click "+ Add Gate" to add one.</p>
        ) : (
          <div className="space-y-4">
            {gates.map((gate) => (
              <div key={gate.id} className="border border-gray-200 rounded-lg p-4 relative">
                <button onClick={() => removeGate(gate.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm">✕</button>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Select label="Gate Type" value={gate.type} onChange={e => updateGate(gate.id, "type", e.target.value)} options={[
                    { value: "walk", label: "Walk Gate (single)" },
                    { value: "single_drive", label: "Single Drive Gate" },
                    { value: "double_drive", label: "Double Drive Gate" },
                    { value: "sliding", label: "Sliding Gate" },
                  ]} />
                  <Input label="Width (feet)" type="number" min={2} max={30} step={0.5} value={gate.width} onChange={e => updateGate(gate.id, "width", parseFloat(e.target.value) || 4)} />
                  <Input label="Height (feet)" type="number" min={3} max={12} step={0.5} value={gate.height} onChange={e => updateGate(gate.id, "height", parseFloat(e.target.value) || 6)} />
                  <Input label="Quantity" type="number" min={1} max={20} value={gate.quantity} onChange={e => updateGate(gate.id, "quantity", parseInt(e.target.value) || 1)} />
                  <Select label="Hardware" value={gate.hardware} onChange={e => updateGate(gate.id, "hardware", e.target.value)} options={[
                    { value: "standard", label: "Standard" },
                    { value: "heavy_duty", label: "Heavy Duty" },
                    { value: "ornamental", label: "Ornamental" },
                  ]} />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Auto Operator?</label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                      <input type="checkbox" checked={gate.autoOperator} onChange={e => updateGate(gate.id, "autoOperator", e.target.checked)} className="rounded" />
                      Add automatic opener
                    </label>
                  </div>
                  {gate.autoOperator && (
                    <Select label="Operator Type" value={gate.operatorType || "swing"} onChange={e => updateGate(gate.id, "operatorType", e.target.value)} options={[
                      { value: "swing", label: "Swing" },
                      { value: "slide", label: "Slide" },
                      { value: "underground", label: "Underground Swing" },
                    ]} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Existing Removal */}
      <Card title="Existing Fence Removal" className="mb-6">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={existingRemoval} onChange={e => setExistingRemoval(e.target.checked)} className="rounded" />
            Remove existing fence
          </label>
          {existingRemoval && (
            <Input
              label="Linear Feet to Remove"
              type="number"
              min={0}
              step={1}
              value={removalFeet || ""}
              onChange={e => setRemovalFeet(Number(e.target.value))}
              className="w-40"
            />
          )}
        </div>
      </Card>

      <div className="flex justify-between">
        <Link href={`/clients/${clientId}/project/${projectId}`}>
          <Button variant="secondary">Back to Project</Button>
        </Link>
        <Button onClick={handleSave} loading={saving} disabled={totalLf === 0}>
          Save & Build Proposal
        </Button>
      </div>
    </AppLayout>
  );
}
