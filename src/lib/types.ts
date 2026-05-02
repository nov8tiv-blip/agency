// ─── Client ───────────────────────────────────────────────────────────────────

export type ClientType = "residential" | "commercial";
export type ClientStatus = "lead" | "active" | "completed" | "lost";

export interface Client {
  id: string;
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone?: string;
  // Address
  address: string;
  city: string;
  state: string;
  zip: string;
  // Meta
  type: ClientType;
  status: ClientStatus;
  source?: string; // how they found us
  notes?: string;
  hubspotContactId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "discovery"
  | "measuring"
  | "proposal_draft"
  | "proposal_sent"
  | "approved"
  | "in_progress"
  | "completed"
  | "lost";

export interface DiscoveryInfo {
  meetingDate: string;
  meetingTime?: string;
  siteAddress: string; // may differ from billing
  siteCity: string;
  siteState: string;
  siteZip: string;
  propertyType: "residential" | "commercial" | "hoa" | "municipal";
  existingFence: boolean;
  existingFenceDescription?: string;
  removalNeeded: boolean;
  removalLinearFeet?: number;
  permitRequired?: boolean;
  permitNotes?: string;
  soilType: "normal" | "clay" | "sandy" | "rocky" | "mixed";
  terrain: "flat" | "slight_slope" | "moderate_slope" | "steep" | "mixed";
  accessNotes?: string;
  clientNotes?: string; // what client described they want
  internalNotes?: string; // our internal notes
  photos?: string[]; // file paths or base64
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  status: ProjectStatus;
  discovery?: DiscoveryInfo;
  fencingSpec?: FencingSpec;
  proposal?: Proposal;
  hubspotDealId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Fencing Spec ─────────────────────────────────────────────────────────────

export type FenceType =
  | "wood"
  | "vinyl"
  | "chain_link"
  | "iron"
  | "aluminum"
  | "composite";

export interface FenceSection {
  id: string;
  label: string;
  linearFeet: number;
  height: number; // in feet
  terrain: "flat" | "slight_slope" | "moderate_slope" | "steep";
  notes?: string;
}

export interface GateSpec {
  id: string;
  type: "walk" | "double_drive" | "single_drive" | "sliding";
  width: number; // in feet
  height: number; // in feet
  autoOperator: boolean;
  operatorType?: "swing" | "slide" | "underground";
  hardware: "standard" | "heavy_duty" | "ornamental";
  quantity: number;
  notes?: string;
}

// ─── Wood Fence Spec ──────────────────────────────────────────────────────────

export type WoodStyle =
  | "privacy"
  | "shadowbox"
  | "board_on_board"
  | "picket"
  | "split_rail"
  | "lattice_top";
export type WoodSpecies = "pine" | "cedar" | "redwood" | "pressure_treated";

export interface WoodFenceSpec {
  fenceType: "wood";
  style: WoodStyle;
  woodSpecies: WoodSpecies;
  picketWidth: 3.5 | 5.5; // 1x4 or 1x6
  picketSpacing: number; // 0 = privacy, 1-4 = semi/decorative
  postSpacing: 6 | 7 | 8; // feet between posts
  postSize: "4x4" | "6x6";
  railCount: 2 | 3;
  addLattice: boolean;
  latticeHeight?: number; // inches of lattice on top
  addStain: boolean;
  stainColor?: string;
  addPostCaps: boolean;
  postCapStyle?: "flat" | "dog_ear" | "gothic" | "ball" | "pyramid";
  sections: FenceSection[];
  gates: GateSpec[];
  existingRemoval: boolean;
  removalFeet?: number;
}

// ─── Vinyl Fence Spec ─────────────────────────────────────────────────────────

export type VinylStyle =
  | "privacy"
  | "semi_privacy"
  | "picket"
  | "ranch_3rail"
  | "ranch_2rail"
  | "shadowbox";
export type VinylColor = "white" | "tan" | "gray" | "clay" | "woodgrain_cedar" | "woodgrain_walnut";

export interface VinylFenceSpec {
  fenceType: "vinyl";
  style: VinylStyle;
  color: VinylColor;
  panelWidth: 6 | 8; // feet
  addFoamFillPosts: boolean;
  postCapStyle: "flat" | "french_gothic" | "gothic" | "ball" | "pyramid";
  sections: FenceSection[];
  gates: GateSpec[];
  existingRemoval: boolean;
  removalFeet?: number;
}

// ─── Chain Link Fence Spec ────────────────────────────────────────────────────

export type ChainLinkGauge = 9 | 11 | 11.5;
export type ChainLinkCoating = "galvanized" | "black_vinyl" | "green_vinyl" | "brown_vinyl";
export type PrivacySlat = "none" | "black" | "green" | "brown" | "gray" | "white";

export interface ChainLinkFenceSpec {
  fenceType: "chain_link";
  gauge: ChainLinkGauge;
  meshOpening: 2 | 2.25; // inches
  coating: ChainLinkCoating;
  linePostSpacing: 10; // standard 10 feet
  addTopRail: boolean;
  addBottomRail: boolean;
  addBarbedWire: boolean;
  barbedWireStrands?: 1 | 2 | 3;
  privacySlats: PrivacySlat;
  sections: FenceSection[];
  gates: GateSpec[];
  existingRemoval: boolean;
  removalFeet?: number;
}

// ─── Iron / Wrought Iron Fence Spec ───────────────────────────────────────────

export type IronStyle = "flat_top" | "spear_top" | "gothic" | "ring_top" | "finial_top" | "custom";
export type IronFinish = "black" | "bronze" | "silver" | "hunter_green" | "custom";

export interface IronFenceSpec {
  fenceType: "iron";
  style: IronStyle;
  picketSpacing: 3.5 | 4; // inches between pickets
  railCount: 2 | 3;
  panelWidth: 4 | 6; // feet
  finish: IronFinish;
  addScrolls: boolean;
  addRings: boolean;
  addFleurDeLis: boolean;
  surfaceMount: boolean; // vs in-ground
  sections: FenceSection[];
  gates: GateSpec[];
  existingRemoval: boolean;
  removalFeet?: number;
}

// ─── Aluminum Fence Spec ──────────────────────────────────────────────────────

export type AluminumStyle =
  | "flat_top"
  | "spear_top"
  | "pool_code"
  | "classic"
  | "contemporary"
  | "puppy_picket";
export type AluminumGrade = "residential" | "commercial" | "industrial";
export type AluminumColor = "black" | "bronze" | "white" | "hunter_green" | "silver";

export interface AluminumFenceSpec {
  fenceType: "aluminum";
  style: AluminumStyle;
  grade: AluminumGrade;
  panelWidth: 4 | 6; // feet
  picketSize: "5/8\"" | "3/4\"" | "1\"";
  color: AluminumColor;
  poolCode: boolean; // meets pool barrier requirements
  sections: FenceSection[];
  gates: GateSpec[];
  existingRemoval: boolean;
  removalFeet?: number;
}

// ─── Composite Fence Spec ─────────────────────────────────────────────────────

export type CompositeStyle = "privacy" | "semi_privacy" | "horizontal_board";
export type CompositeBoardWidth = 4 | 5.5 | 6;
export type BoardOrientation = "horizontal" | "vertical";

export interface CompositeFenceSpec {
  fenceType: "composite";
  style: CompositeStyle;
  boardWidth: CompositeBoardWidth; // inches
  boardOrientation: BoardOrientation;
  color: string; // free-form (e.g. "Trex Clam Shell")
  postSpacing: 6 | 8;
  postType: "aluminum_sleeve" | "all_aluminum" | "wood_with_sleeve";
  boardGap: number; // inches between boards (0 = privacy)
  sections: FenceSection[];
  gates: GateSpec[];
  existingRemoval: boolean;
  removalFeet?: number;
}

// ─── Union Type ───────────────────────────────────────────────────────────────

export type FencingSpec =
  | WoodFenceSpec
  | VinylFenceSpec
  | ChainLinkFenceSpec
  | IronFenceSpec
  | AluminumFenceSpec
  | CompositeFenceSpec;

// ─── Proposal ─────────────────────────────────────────────────────────────────

export type ProposalStatus = "draft" | "sent" | "viewed" | "approved" | "declined" | "expired";

export interface LineItem {
  id: string;
  category: "materials" | "labor" | "equipment" | "removal" | "permits" | "misc";
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface Proposal {
  id: string;
  projectId: string;
  clientId: string;
  proposalNumber: string;
  status: ProposalStatus;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  depositPercent: number;
  depositAmount: number;
  validDays: number;
  validUntil: string;
  terms: string;
  notes?: string;
  attachedPhotos?: string[];
  sentAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Material List / PO ───────────────────────────────────────────────────────

export interface MaterialItem {
  id: string;
  category: string;
  description: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  projectId: string;
  poNumber: string;
  supplier: string;
  supplierContact?: string;
  supplierEmail?: string;
  items: MaterialItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "confirmed" | "received";
  notes?: string;
  createdAt: string;
}

// ─── Follow Up ────────────────────────────────────────────────────────────────

export type FollowUpType = "call" | "email" | "text" | "in_person";
export type FollowUpStatus = "pending" | "completed" | "cancelled";

export interface FollowUp {
  id: string;
  clientId: string;
  projectId?: string;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduledAt: string;
  completedAt?: string;
  notes?: string;
  outcome?: string;
  createdAt: string;
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  company: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    website?: string;
    licenseNumber?: string;
    logoUrl?: string;
  };
  integrations: {
    hubspotApiKey?: string;
    hubspotPipelineId?: string;
    hubspotStageIds?: Record<string, string>;
    gmailUser?: string;
    gmailAppPassword?: string;
    yelpUrl?: string;
    googleReviewUrl?: string;
  };
  proposal: {
    defaultTaxRate: number;
    defaultValidDays: number;
    defaultDepositPercent: number;
    defaultTerms: string;
    defaultNotes?: string;
  };
  pricing: {
    laborRatePerFoot: number;
    removalRatePerFoot: number;
    permitFlatFee: number;
    fuelSurcharge: number;
    markupPercent: number;
  };
}
