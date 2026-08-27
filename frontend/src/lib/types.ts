export type CampaignStatus = "ACTIVE" | "COMPLETED" | "CLOSED";
export type Role = "USER" | "ADMIN";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  /** Decimal string, e.g. "25000.00" */
  targetAmount: string;
  /** Decimal string, e.g. "8700.00" */
  collectedAmount: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

/** Fields an administrator can set; `status` and `collectedAmount` are API-managed. */
export interface CampaignInput {
  title: string;
  description: string;
  /** Decimal string, e.g. "10000.00" */
  targetAmount: string;
}

export interface Donation {
  id: string;
  amount: string;
  donorName: string;
  campaignId: string;
  userId: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Health {
  status: string;
  /** "up" | "down" */
  database: string;
  timestamp: string;
}
