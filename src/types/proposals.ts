export type ProposalStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "SIGNED"
  | "DECLINED"
  | "EXPIRED";

export interface LineItemRecord {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  order: number;
}

export interface ProposalRecord {
  id: string;
  title: string;
  status: ProposalStatus;
  dealId?: string | null;
  recipientEmail?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  pdfS3Key?: string | null;
  signedAt?: string | null;
  signatureName?: string | null;
  viewedAt?: string | null;
  publicToken: string;
  createdAt: string;
  updatedAt: string;
  lineItems: LineItemRecord[];
  deal?: { id: string; name: string } | null;
}
