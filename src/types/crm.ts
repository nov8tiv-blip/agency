export type LifecycleStage =
  | "lead"
  | "subscriber"
  | "opportunity"
  | "customer"
  | "evangelist";

export interface ContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  linkedinUrl?: string | null;
  companyId?: string | null;
  lifecycleStage: LifecycleStage;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string } | null;
}

export interface CompanyRecord {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  annualRevenue?: number | null;
  city?: string | null;
  country?: string | null;
  createdAt: string;
}

export type ActivityType = "NOTE" | "CALL" | "EMAIL" | "MEETING" | "TASK";

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  subject: string;
  body?: string | null;
  durationMin?: number | null;
  outcome?: string | null;
  direction?: string | null;
  occurredAt: string;
  user: { id: string; name: string };
}

export interface DealRecord {
  id: string;
  name: string;
  amount?: number | null;
  closeDate?: string | null;
  stageId: string;
  pipelineId: string;
  probability?: number | null;
  lostReason?: string | null;
  createdAt: string;
  stage: { id: string; name: string; probability: number; order: number };
  company?: { id: string; name: string } | null;
  owner: { id: string; name: string };
}

export interface StageRecord {
  id: string;
  name: string;
  order: number;
  probability: number;
  pipelineId: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}
