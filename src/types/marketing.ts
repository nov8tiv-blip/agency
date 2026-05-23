export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "PAUSED";

export type RecipientStatus =
  | "PENDING"
  | "SENT"
  | "OPENED"
  | "CLICKED"
  | "BOUNCED"
  | "COMPLAINED"
  | "UNSUBSCRIBED";

export interface CampaignRecord {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  status: CampaignStatus;
  bodyHtml: string;
  bodyText?: string | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  _count?: { recipients: number };
}

export interface CampaignAnalytics {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  clicks: { url: string; count: number }[];
}
