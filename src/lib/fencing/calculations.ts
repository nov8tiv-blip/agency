import type {
  WoodFenceSpec,
  VinylFenceSpec,
  ChainLinkFenceSpec,
  IronFenceSpec,
  AluminumFenceSpec,
  CompositeFenceSpec,
  FencingSpec,
  FenceSection,
  GateSpec,
  MaterialItem,
} from "../types";

let _itemId = 1;
function mkId() {
  return `mat_${_itemId++}`;
}

function totalFeet(sections: FenceSection[]): number {
  return sections.reduce((sum, s) => sum + s.linearFeet, 0);
}

function avgHeight(sections: FenceSection[]): number {
  if (!sections.length) return 6;
  return sections.reduce((sum, s) => sum + s.height, 0) / sections.length;
}

function gateOpenings(gates: GateSpec[]): number {
  return gates.reduce((sum, g) => sum + g.width * g.quantity, 0);
}

// ─── Wood ─────────────────────────────────────────────────────────────────────

export function calcWoodMaterials(spec: WoodFenceSpec): MaterialItem[] {
  const items: MaterialItem[] = [];
  const lf = totalFeet(spec.sections);
  const height = avgHeight(spec.sections);
  const gateQty = spec.gates.reduce((s, g) => s + g.quantity, 0);

  // Posts
  const postSpacing = spec.postSpacing;
  // line posts + 2 end posts per run; approximate corners as 4
  const linePosts = Math.ceil(lf / postSpacing) - 1;
  const endPosts = 2;
  const cornerPosts = 2; // estimate
  const gatePostPairs = gateQty * 2;
  const totalPosts = linePosts + endPosts + cornerPosts + gatePostPairs;

  // Post length: fence height + burial (1/3 height + 6" min 24")
  const burialFt = Math.max(2, height / 3 + 0.5);
  const postLenNeeded = height + burialFt;
  const postLen = postLenNeeded <= 7 ? 8 : postLenNeeded <= 9 ? 10 : 12;

  items.push({
    id: mkId(),
    category: "Posts",
    description: `${spec.postSize} x ${postLen}' ${spec.woodSpecies === "pressure_treated" ? "PT" : spec.woodSpecies} posts`,
    quantity: totalPosts,
    unit: "ea",
    unitCost: spec.postSize === "4x4" ? (postLen <= 8 ? 18 : 26) : (postLen <= 8 ? 28 : 40),
    totalCost: 0,
  });

  // Rails
  // 2 rails for ≤5', 3 rails for 6'+
  const railsPerBay = spec.railCount;
  const bays = totalPosts - 1;
  const totalRailLf = bays * postSpacing * railsPerBay;
  // Rails sold as 2x4x8 or 2x4x16
  const railBoards8ft = Math.ceil(totalRailLf / 8);

  items.push({
    id: mkId(),
    category: "Rails",
    description: `2x4x8' ${spec.woodSpecies === "pressure_treated" ? "PT" : spec.woodSpecies} rails`,
    quantity: railBoards8ft,
    unit: "ea",
    unitCost: spec.woodSpecies === "pressure_treated" ? 9 : 7,
    totalCost: 0,
  });

  // Pickets (for privacy/shadowbox/picket styles)
  if (spec.style !== "split_rail") {
    const picketWidthIn = spec.picketWidth;
    const spacingIn = spec.picketSpacing;
    const effectiveWidth = picketWidthIn + spacingIn;
    const picketsPerFoot = 12 / effectiveWidth;
    const rawPickets = Math.ceil(lf * picketsPerFoot * 1.05); // 5% waste

    const picketLen = height <= 4 ? 4 : height <= 6 ? 6 : 8;
    items.push({
      id: mkId(),
      category: "Pickets",
      description: `1x${picketWidthIn === 3.5 ? "4" : "6"}x${picketLen}' ${spec.woodSpecies === "pressure_treated" ? "PT" : spec.woodSpecies} fence pickets`,
      quantity: rawPickets,
      unit: "ea",
      unitCost: picketWidthIn === 3.5 ? 2.5 : 3.5,
      totalCost: 0,
    });
  }

  // Concrete
  const bagsPerPost = spec.postSize === "4x4" ? 2 : 3;
  const concreteBags = totalPosts * bagsPerPost;
  items.push({
    id: mkId(),
    category: "Concrete",
    description: "80 lb concrete mix (Quikrete or equiv.)",
    quantity: concreteBags,
    unit: "bags",
    unitCost: 6.5,
    totalCost: 0,
  });

  // Hardware (screws / nails)
  const screwBoxes = Math.ceil(lf / 50); // 1 lb box per 50 lf
  items.push({
    id: mkId(),
    category: "Hardware",
    description: "1-5/8\" exterior screws (1 lb box)",
    quantity: screwBoxes,
    unit: "box",
    unitCost: 12,
    totalCost: 0,
  });

  // Post caps
  if (spec.addPostCaps) {
    items.push({
      id: mkId(),
      category: "Hardware",
      description: `${spec.postCapStyle || "flat"} post caps (${spec.postSize})`,
      quantity: totalPosts,
      unit: "ea",
      unitCost: spec.postCapStyle === "ball" ? 6.5 : 3.5,
      totalCost: 0,
    });
  }

  // Lattice top
  if (spec.addLattice && spec.latticeHeight) {
    const latticePanels = Math.ceil(lf / 8); // 4x8 panels
    items.push({
      id: mkId(),
      category: "Lattice",
      description: `4x8 ${spec.woodSpecies === "pressure_treated" ? "PT" : "cedar"} diagonal lattice panels`,
      quantity: latticePanels,
      unit: "ea",
      unitCost: 28,
      totalCost: 0,
    });
  }

  // Stain / sealer
  if (spec.addStain) {
    const sqFt = lf * height * (spec.style === "shadowbox" || spec.style === "board_on_board" ? 1.5 : 1);
    const gallons = Math.ceil(sqFt / 200); // ~200 sqft per gallon
    items.push({
      id: mkId(),
      category: "Stain/Sealer",
      description: `Exterior fence stain/sealer${spec.stainColor ? ` - ${spec.stainColor}` : ""}`,
      quantity: gallons,
      unit: "gal",
      unitCost: 38,
      totalCost: 0,
    });
  }

  // Removal
  if (spec.existingRemoval && spec.removalFeet) {
    items.push({
      id: mkId(),
      category: "Removal",
      description: "Existing fence removal & haul-off",
      quantity: spec.removalFeet,
      unit: "lf",
      unitCost: 4.5,
      totalCost: 0,
    });
  }

  // Gate hardware
  spec.gates.forEach((g) => {
    for (let i = 0; i < g.quantity; i++) {
      items.push({
        id: mkId(),
        category: "Gate Hardware",
        description: `${g.type.replace("_", " ")} gate hardware kit (${g.width}' x ${g.height}')`,
        quantity: 1,
        unit: "set",
        unitCost: g.type === "double_drive" ? 85 : 45,
        totalCost: 0,
      });
      if (g.autoOperator) {
        items.push({
          id: mkId(),
          category: "Gate Hardware",
          description: `Automatic gate operator - ${g.operatorType || "swing"}`,
          quantity: 1,
          unit: "ea",
          unitCost: g.type === "double_drive" ? 2400 : 1600,
          totalCost: 0,
        });
      }
    }
  });

  return computeTotals(items);
}

// ─── Vinyl ────────────────────────────────────────────────────────────────────

export function calcVinylMaterials(spec: VinylFenceSpec): MaterialItem[] {
  const items: MaterialItem[] = [];
  const lf = totalFeet(spec.sections);
  const height = avgHeight(spec.sections);
  const gateQty = spec.gates.reduce((s, g) => s + g.quantity, 0);

  // Panels
  const panelWidth = spec.panelWidth;
  const panels = Math.ceil(lf / panelWidth);

  items.push({
    id: mkId(),
    category: "Panels",
    description: `${height}' x ${panelWidth}' vinyl fence panel - ${spec.style} - ${spec.color}`,
    quantity: panels,
    unit: "ea",
    unitCost: panelWidth === 8 ? (height <= 4 ? 65 : height <= 6 ? 95 : 130) : (height <= 4 ? 55 : height <= 6 ? 80 : 115),
    totalCost: 0,
  });

  // Posts
  const totalPosts = panels + 1 + 2 + gateQty * 2; // +1 end, +2 corner est., +2 per gate
  const burialFt = Math.max(2, height / 3 + 0.5);
  const postLenNeeded = height + burialFt;
  const postLen = Math.ceil(postLenNeeded / 0.5) * 0.5; // nearest half-foot

  items.push({
    id: mkId(),
    category: "Posts",
    description: `${height <= 4 ? "3.5in" : "4.5in"} vinyl fence post ${postLen.toFixed(1)}ft - ${spec.color}`,
    quantity: totalPosts,
    unit: "ea",
    unitCost: height <= 4 ? 38 : height <= 6 ? 55 : 75,
    totalCost: 0,
  });

  // Post caps
  items.push({
    id: mkId(),
    category: "Post Caps",
    description: `${spec.postCapStyle} vinyl post caps - ${spec.color}`,
    quantity: totalPosts,
    unit: "ea",
    unitCost: spec.postCapStyle === "ball" ? 8 : 4.5,
    totalCost: 0,
  });

  // Concrete
  const concreteBags = totalPosts * 2;
  items.push({
    id: mkId(),
    category: "Concrete",
    description: "80 lb concrete mix",
    quantity: concreteBags,
    unit: "bags",
    unitCost: 6.5,
    totalCost: 0,
  });

  // Foam fill for posts
  if (spec.addFoamFillPosts) {
    items.push({
      id: mkId(),
      category: "Post Foam Fill",
      description: "Expanding foam post fill (prevents vibration)",
      quantity: totalPosts,
      unit: "ea",
      unitCost: 3.5,
      totalCost: 0,
    });
  }

  // Removal
  if (spec.existingRemoval && spec.removalFeet) {
    items.push({
      id: mkId(),
      category: "Removal",
      description: "Existing fence removal & haul-off",
      quantity: spec.removalFeet,
      unit: "lf",
      unitCost: 4.5,
      totalCost: 0,
    });
  }

  // Gate hardware
  spec.gates.forEach((g) => {
    for (let i = 0; i < g.quantity; i++) {
      items.push({
        id: mkId(),
        category: "Gate Hardware",
        description: `Vinyl ${g.type.replace("_", " ")} gate frame & hardware (${g.width}')`,
        quantity: 1,
        unit: "set",
        unitCost: g.type === "double_drive" ? 320 : 220,
        totalCost: 0,
      });
    }
  });

  return computeTotals(items);
}

// ─── Chain Link ───────────────────────────────────────────────────────────────

export function calcChainLinkMaterials(spec: ChainLinkFenceSpec): MaterialItem[] {
  const items: MaterialItem[] = [];
  const lf = totalFeet(spec.sections);
  const height = avgHeight(spec.sections);
  const gateQty = spec.gates.reduce((s, g) => s + g.quantity, 0);

  const isVinylCoated = spec.coating !== "galvanized";
  const gaugeLabel = `${spec.gauge} gauge`;
  const coatingLabel = isVinylCoated ? spec.coating.replace("_vinyl", " vinyl coated") : "galvanized";

  // Mesh
  const meshRolls = Math.ceil(lf / 50); // 50' rolls standard
  items.push({
    id: mkId(),
    category: "Mesh",
    description: `Chain link mesh ${height}' x 50' roll - ${gaugeLabel} - ${spec.meshOpening}" - ${coatingLabel}`,
    quantity: meshRolls,
    unit: "roll",
    unitCost: (height <= 4 ? 45 : height <= 6 ? 70 : 95) * (isVinylCoated ? 1.35 : 1),
    totalCost: 0,
  });

  // Terminal posts (end/corner/gate)
  const corners = 2; // estimate
  const terminalPosts = 2 + corners + gateQty * 2;
  const terminalPostLen = height + 2; // 2' burial

  items.push({
    id: mkId(),
    category: "Posts",
    description: `Terminal post ${terminalPostLen}' - ${coatingLabel} (2-3/8" OD for ≤6', 3" OD for 8'+)`,
    quantity: terminalPosts,
    unit: "ea",
    unitCost: (height <= 6 ? 18 : 28) * (isVinylCoated ? 1.3 : 1),
    totalCost: 0,
  });

  // Line posts
  const linePostSpacing = spec.linePostSpacing;
  const linePosts = Math.max(0, Math.floor(lf / linePostSpacing) - 1);
  const linePostLen = height + 2;

  items.push({
    id: mkId(),
    category: "Posts",
    description: `Line post ${linePostLen}' - ${coatingLabel} (1-5/8" OD)`,
    quantity: linePosts,
    unit: "ea",
    unitCost: (height <= 6 ? 12 : 18) * (isVinylCoated ? 1.3 : 1),
    totalCost: 0,
  });

  // Post caps (line posts only)
  items.push({
    id: mkId(),
    category: "Hardware",
    description: `Line post cap / mushroom cap - ${coatingLabel}`,
    quantity: linePosts,
    unit: "ea",
    unitCost: 1.5 * (isVinylCoated ? 1.3 : 1),
    totalCost: 0,
  });

  // Top rail
  if (spec.addTopRail) {
    const topRailSections = Math.ceil(lf / 21); // 21' sections
    items.push({
      id: mkId(),
      category: "Rails",
      description: `Top rail 1-3/8" x 21' - ${coatingLabel}`,
      quantity: topRailSections,
      unit: "ea",
      unitCost: 14 * (isVinylCoated ? 1.3 : 1),
      totalCost: 0,
    });

    // Rail ends (2 per run)
    items.push({
      id: mkId(),
      category: "Hardware",
      description: `Top rail ends - ${coatingLabel}`,
      quantity: terminalPosts * 2,
      unit: "ea",
      unitCost: 3,
      totalCost: 0,
    });

    // Loop caps (where top rail meets line posts)
    items.push({
      id: mkId(),
      category: "Hardware",
      description: `Loop cap (top rail sleeve) - ${coatingLabel}`,
      quantity: linePosts,
      unit: "ea",
      unitCost: 2.5,
      totalCost: 0,
    });
  }

  // Tension wire (bottom)
  if (!spec.addBottomRail) {
    const tensionWireCoils = Math.ceil(lf / 170); // ~170' per coil
    items.push({
      id: mkId(),
      category: "Rails",
      description: `Bottom tension wire 9 gauge - ${coatingLabel}`,
      quantity: tensionWireCoils,
      unit: "coil",
      unitCost: 22,
      totalCost: 0,
    });
  }

  if (spec.addBottomRail) {
    const bottomRailSections = Math.ceil(lf / 21);
    items.push({
      id: mkId(),
      category: "Rails",
      description: `Bottom rail 1-3/8" x 21' - ${coatingLabel}`,
      quantity: bottomRailSections,
      unit: "ea",
      unitCost: 14 * (isVinylCoated ? 1.3 : 1),
      totalCost: 0,
    });
  }

  // Tension bands (3 per terminal post)
  items.push({
    id: mkId(),
    category: "Hardware",
    description: `Tension bands - ${coatingLabel}`,
    quantity: terminalPosts * 3,
    unit: "ea",
    unitCost: 1.25,
    totalCost: 0,
  });

  // Brace bands (2 per terminal post)
  items.push({
    id: mkId(),
    category: "Hardware",
    description: `Brace bands - ${coatingLabel}`,
    quantity: terminalPosts * 2,
    unit: "ea",
    unitCost: 1.25,
    totalCost: 0,
  });

  // Eye tops (all posts)
  items.push({
    id: mkId(),
    category: "Hardware",
    description: `Fence ties / hog rings (per 100 count bag)`,
    quantity: Math.ceil(lf / 50),
    unit: "bag",
    unitCost: 8,
    totalCost: 0,
  });

  // Tension bars (2 per end, 1 per gate jamb)
  items.push({
    id: mkId(),
    category: "Hardware",
    description: `Tension bars (2 per end/corner)`,
    quantity: terminalPosts,
    unit: "ea",
    unitCost: 4.5,
    totalCost: 0,
  });

  // Concrete
  const concreteBags = terminalPosts * 2 + linePosts * 1;
  items.push({
    id: mkId(),
    category: "Concrete",
    description: "80 lb concrete mix",
    quantity: concreteBags,
    unit: "bags",
    unitCost: 6.5,
    totalCost: 0,
  });

  // Barbed wire
  if (spec.addBarbedWire && spec.barbedWireStrands) {
    const barbedCoils = Math.ceil(lf / 1320) * spec.barbedWireStrands; // 1320' = quarter mile
    items.push({
      id: mkId(),
      category: "Barbed Wire",
      description: `Barbed wire 12.5 gauge (1320' roll) - ${spec.barbedWireStrands} strand(s)`,
      quantity: barbedCoils,
      unit: "roll",
      unitCost: 35,
      totalCost: 0,
    });
  }

  // Privacy slats
  if (spec.privacySlats !== "none") {
    const slatBags = Math.ceil(lf / 10); // ~10 lf per bag
    items.push({
      id: mkId(),
      category: "Privacy Slats",
      description: `${spec.privacySlats} privacy slats for chain link (per 10 lf bag)`,
      quantity: slatBags,
      unit: "bag",
      unitCost: 28,
      totalCost: 0,
    });
  }

  // Removal
  if (spec.existingRemoval && spec.removalFeet) {
    items.push({
      id: mkId(),
      category: "Removal",
      description: "Existing fence removal & haul-off",
      quantity: spec.removalFeet,
      unit: "lf",
      unitCost: 3.5,
      totalCost: 0,
    });
  }

  // Gate hardware
  spec.gates.forEach((g) => {
    for (let i = 0; i < g.quantity; i++) {
      items.push({
        id: mkId(),
        category: "Gate Hardware",
        description: `Chain link ${g.type.replace("_", " ")} gate frame (${g.width}' x ${g.height}') - ${coatingLabel}`,
        quantity: 1,
        unit: "ea",
        unitCost: g.type === "double_drive" ? 180 : g.width <= 4 ? 75 : 120,
        totalCost: 0,
      });
      items.push({
        id: mkId(),
        category: "Gate Hardware",
        description: "Gate hinge set (2 pair)",
        quantity: 1,
        unit: "set",
        unitCost: 22,
        totalCost: 0,
      });
      items.push({
        id: mkId(),
        category: "Gate Hardware",
        description: "Gate fork latch",
        quantity: 1,
        unit: "ea",
        unitCost: 12,
        totalCost: 0,
      });
    }
  });

  return computeTotals(items);
}

// ─── Iron / Wrought Iron ──────────────────────────────────────────────────────

export function calcIronMaterials(spec: IronFenceSpec): MaterialItem[] {
  const items: MaterialItem[] = [];
  const lf = totalFeet(spec.sections);
  const height = avgHeight(spec.sections);
  const gateQty = spec.gates.reduce((s, g) => s + g.quantity, 0);

  const panelWidth = spec.panelWidth;
  const panels = Math.ceil(lf / panelWidth);
  const corners = 2;
  const totalPosts = panels + 1 + corners + gateQty * 2;

  const decorLabel = [
    spec.addScrolls ? "scrolls" : "",
    spec.addRings ? "rings" : "",
    spec.addFleurDeLis ? "fleur-de-lis" : "",
  ]
    .filter(Boolean)
    .join(", ");

  items.push({
    id: mkId(),
    category: "Panels",
    description: `Wrought iron panel ${panelWidth}' x ${height}' - ${spec.style}${decorLabel ? ` w/ ${decorLabel}` : ""} - ${spec.finish}`,
    quantity: panels,
    unit: "ea",
    unitCost: (height <= 4 ? 85 : height <= 5 ? 110 : 140) * panelWidth,
    totalCost: 0,
  });

  items.push({
    id: mkId(),
    category: "Posts",
    description: `Wrought iron line post ${height + 2}' - ${spec.finish}`,
    quantity: totalPosts,
    unit: "ea",
    unitCost: height <= 4 ? 45 : height <= 5 ? 60 : 80,
    totalCost: 0,
  });

  const concreteBags = totalPosts * 2;
  items.push({
    id: mkId(),
    category: "Concrete",
    description: "80 lb concrete mix",
    quantity: concreteBags,
    unit: "bags",
    unitCost: 6.5,
    totalCost: 0,
  });

  items.push({
    id: mkId(),
    category: "Hardware",
    description: "Panel fastener hardware / bracket set",
    quantity: panels,
    unit: "set",
    unitCost: 12,
    totalCost: 0,
  });

  // Touch-up paint
  items.push({
    id: mkId(),
    category: "Finish",
    description: `Rust-oleum spray paint - ${spec.finish} (touch-up)`,
    quantity: Math.ceil(lf / 100),
    unit: "can",
    unitCost: 8,
    totalCost: 0,
  });

  if (spec.existingRemoval && spec.removalFeet) {
    items.push({
      id: mkId(),
      category: "Removal",
      description: "Existing fence removal & haul-off",
      quantity: spec.removalFeet,
      unit: "lf",
      unitCost: 6,
      totalCost: 0,
    });
  }

  spec.gates.forEach((g) => {
    for (let i = 0; i < g.quantity; i++) {
      items.push({
        id: mkId(),
        category: "Gate Hardware",
        description: `Wrought iron ${g.type.replace("_", " ")} gate (${g.width}' x ${g.height}') - ${spec.finish}`,
        quantity: 1,
        unit: "ea",
        unitCost: g.type === "double_drive" ? g.width * 160 : g.width * 140,
        totalCost: 0,
      });
    }
  });

  return computeTotals(items);
}

// ─── Aluminum ─────────────────────────────────────────────────────────────────

export function calcAluminumMaterials(spec: AluminumFenceSpec): MaterialItem[] {
  const items: MaterialItem[] = [];
  const lf = totalFeet(spec.sections);
  const height = avgHeight(spec.sections);
  const gateQty = spec.gates.reduce((s, g) => s + g.quantity, 0);

  const panelWidth = spec.panelWidth;
  const panels = Math.ceil(lf / panelWidth);
  const corners = 2;
  const totalPosts = panels + 1 + corners + gateQty * 2;

  const gradeMultiplier = spec.grade === "residential" ? 1 : spec.grade === "commercial" ? 1.35 : 1.7;

  items.push({
    id: mkId(),
    category: "Panels",
    description: `Aluminum fence panel ${panelWidth}' x ${height}' - ${spec.style} - ${spec.color} - ${spec.grade}`,
    quantity: panels,
    unit: "ea",
    unitCost: Math.round((height <= 4 ? 55 : height <= 5 ? 75 : 95) * panelWidth * gradeMultiplier),
    totalCost: 0,
  });

  items.push({
    id: mkId(),
    category: "Posts",
    description: `Aluminum fence post ${height + 2}' - ${spec.color} - ${spec.grade}`,
    quantity: totalPosts,
    unit: "ea",
    unitCost: Math.round((height <= 4 ? 28 : height <= 5 ? 38 : 50) * gradeMultiplier),
    totalCost: 0,
  });

  items.push({
    id: mkId(),
    category: "Concrete",
    description: "80 lb concrete mix",
    quantity: totalPosts * 2,
    unit: "bags",
    unitCost: 6.5,
    totalCost: 0,
  });

  items.push({
    id: mkId(),
    category: "Hardware",
    description: "Stainless steel screw fastener set",
    quantity: panels,
    unit: "set",
    unitCost: 8,
    totalCost: 0,
  });

  if (spec.existingRemoval && spec.removalFeet) {
    items.push({
      id: mkId(),
      category: "Removal",
      description: "Existing fence removal & haul-off",
      quantity: spec.removalFeet,
      unit: "lf",
      unitCost: 5,
      totalCost: 0,
    });
  }

  spec.gates.forEach((g) => {
    for (let i = 0; i < g.quantity; i++) {
      items.push({
        id: mkId(),
        category: "Gate Hardware",
        description: `Aluminum ${g.type.replace("_", " ")} gate (${g.width}' x ${g.height}') - ${spec.color}`,
        quantity: 1,
        unit: "ea",
        unitCost: Math.round(g.type === "double_drive" ? g.width * 95 : g.width * 85) * gradeMultiplier,
        totalCost: 0,
      });
      if (g.autoOperator) {
        items.push({
          id: mkId(),
          category: "Gate Hardware",
          description: `Automatic gate operator - ${g.operatorType || "swing"}`,
          quantity: 1,
          unit: "ea",
          unitCost: 1800,
          totalCost: 0,
        });
      }
    }
  });

  return computeTotals(items);
}

// ─── Composite ────────────────────────────────────────────────────────────────

export function calcCompositeMaterials(spec: CompositeFenceSpec): MaterialItem[] {
  const items: MaterialItem[] = [];
  const lf = totalFeet(spec.sections);
  const height = avgHeight(spec.sections);
  const gateQty = spec.gates.reduce((s, g) => s + g.quantity, 0);

  const postSpacing = spec.postSpacing;
  const linePosts = Math.ceil(lf / postSpacing) - 1;
  const endPosts = 2;
  const corners = 2;
  const totalPosts = linePosts + endPosts + corners + gateQty * 2;
  const bays = totalPosts - 1;

  // Boards (composite decking boards used as fence boards)
  const boardWidthIn = spec.boardWidth;
  const boardGapIn = spec.boardGap;
  const effectiveBoardW = boardWidthIn + boardGapIn;
  const boardsPerHeight = Math.ceil((height * 12) / effectiveBoardW);

  if (spec.boardOrientation === "horizontal") {
    // Boards run horizontally, each bay needs boardsPerHeight boards at postSpacing length
    const totalBoardLf = boardsPerHeight * bays * postSpacing * 1.05;
    const boardLen = postSpacing <= 6 ? 12 : 16;
    const boardCount = Math.ceil(totalBoardLf / boardLen);

    items.push({
      id: mkId(),
      category: "Composite Boards",
      description: `${boardWidthIn}" composite fence/deck board ${boardLen}' - ${spec.color}`,
      quantity: boardCount,
      unit: "ea",
      unitCost: boardLen === 12 ? 28 : 36,
      totalCost: 0,
    });
  } else {
    // Vertical boards: treat like pickets
    const boardLen = height + 0.5; // slight overage
    const picketsPerFoot = 12 / effectiveBoardW;
    const totalBoards = Math.ceil(lf * picketsPerFoot * 1.05);
    items.push({
      id: mkId(),
      category: "Composite Boards",
      description: `${boardWidthIn}" composite fence board ${Math.ceil(boardLen)}' - ${spec.color}`,
      quantity: totalBoards,
      unit: "ea",
      unitCost: boardWidthIn <= 4 ? 14 : 20,
      totalCost: 0,
    });
  }

  // Posts
  const postType = spec.postType;
  const postLen = height + Math.max(2, height / 3);
  items.push({
    id: mkId(),
    category: "Posts",
    description: `${postType.replace("_", " ")} fence post ${Math.ceil(postLen)}' (${spec.color.split(" ")[0]} sleeve)`,
    quantity: totalPosts,
    unit: "ea",
    unitCost: postType === "all_aluminum" ? 65 : postType === "aluminum_sleeve" ? 45 : 35,
    totalCost: 0,
  });

  // Rails (horizontal framing for vertical boards, or top/bottom cap for horizontal)
  const railsPerBay = spec.boardOrientation === "vertical" ? 3 : 2;
  const totalRailLf = bays * postSpacing * railsPerBay;
  items.push({
    id: mkId(),
    category: "Rails",
    description: `Composite rail / 2x4 treated for framing`,
    quantity: Math.ceil(totalRailLf / 8), // 8' boards
    unit: "ea",
    unitCost: 22,
    totalCost: 0,
  });

  // Concrete
  items.push({
    id: mkId(),
    category: "Concrete",
    description: "80 lb concrete mix",
    quantity: totalPosts * 2,
    unit: "bags",
    unitCost: 6.5,
    totalCost: 0,
  });

  // Hardware
  items.push({
    id: mkId(),
    category: "Hardware",
    description: "Stainless steel screws / hidden fastener clips",
    quantity: Math.ceil(lf / 25),
    unit: "box",
    unitCost: 18,
    totalCost: 0,
  });

  if (spec.existingRemoval && spec.removalFeet) {
    items.push({
      id: mkId(),
      category: "Removal",
      description: "Existing fence removal & haul-off",
      quantity: spec.removalFeet,
      unit: "lf",
      unitCost: 4.5,
      totalCost: 0,
    });
  }

  spec.gates.forEach((g) => {
    for (let i = 0; i < g.quantity; i++) {
      items.push({
        id: mkId(),
        category: "Gate Hardware",
        description: `Composite ${g.type.replace("_", " ")} gate frame & boards (${g.width}' x ${g.height}')`,
        quantity: 1,
        unit: "set",
        unitCost: g.type === "double_drive" ? 480 : 280,
        totalCost: 0,
      });
    }
  });

  return computeTotals(items);
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export function calculateMaterials(spec: FencingSpec): MaterialItem[] {
  _itemId = 1;
  switch (spec.fenceType) {
    case "wood":
      return calcWoodMaterials(spec);
    case "vinyl":
      return calcVinylMaterials(spec);
    case "chain_link":
      return calcChainLinkMaterials(spec);
    case "iron":
      return calcIronMaterials(spec);
    case "aluminum":
      return calcAluminumMaterials(spec);
    case "composite":
      return calcCompositeMaterials(spec);
  }
}

function computeTotals(items: MaterialItem[]): MaterialItem[] {
  return items.map((item) => ({
    ...item,
    totalCost: Math.round(item.quantity * item.unitCost * 100) / 100,
  }));
}

export function sumMaterials(items: MaterialItem[]): number {
  return items.reduce((sum, i) => sum + i.totalCost, 0);
}

export function totalLinearFeet(spec: FencingSpec): number {
  return totalFeet(spec.sections);
}
