import type { LeadStatus, Role } from "@prisma/client";
import { getDefaultLlmModel } from "@/lib/ai/config";

export const APP_NAME = "ReviveLead";
export const APP_TAGLINE = "Turn Lost Leads Into Revenue.";

export const MARKETS = ["Dubai", "Qatar", "Mumbai", "Bangalore"] as const;

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING_SCHEDULED",
  "NEGOTIATION",
  "WON",
  "LOST",
  "DORMANT",
];

export const LEAD_SOURCES = [
  "Bayut",
  "Property Finder",
  "Website",
  "Walk-in",
  "Referral",
  "Instagram",
  "Google Ads",
  "WhatsApp",
  "Portal import",
] as const;

export const PROPERTY_TYPES = [
  "Apartment",
  "Villa",
  "Townhouse",
  "Penthouse",
  "Studio",
  "Office",
  "Plot",
] as const;

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  SALES_MANAGER: "Sales Manager",
  SALES_AGENT: "Sales Agent",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  VIEWING_SCHEDULED: "Viewing Scheduled",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
  DORMANT: "Dormant",
};

export const MANAGER_ROLES: Role[] = ["OWNER", "ADMIN", "SALES_MANAGER"];
export const ADMIN_ROLES: Role[] = ["OWNER", "ADMIN"];

export const DEFAULT_FOLLOW_UP_TEMPLATES = {
  immediate: "Thanks for your enquiry. An advisor will share matching options shortly.",
  day1: "Just checking if you're still looking — I can send two options that match what you asked for.",
  day3: "Would you like us to send matching properties this week?",
  day7: "Final follow-up from our team. If the search is still live, reply and we will pick it up immediately.",
};

export const DEFAULT_FOLLOW_UP_SETTINGS = {
  immediateResponseMinutes: 0,
  firstFollowUpHours: 24,
  secondFollowUpHours: 72,
  agentAlertHours: 168,
  dormantDays: 30,
  businessHoursStart: 9,
  businessHoursEnd: 19,
  respectBusinessHours: true,
  templates: DEFAULT_FOLLOW_UP_TEMPLATES,
};

export type FollowUpSettings = typeof DEFAULT_FOLLOW_UP_SETTINGS;

export type OrgSettings = {
  followUp: FollowUpSettings;
  notifications: {
    email: boolean;
    inApp: boolean;
    agentAlerts: boolean;
  };
  ai: {
    model: string;
    autoQualify: boolean;
    suggestReplies: boolean;
  };
};

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  followUp: DEFAULT_FOLLOW_UP_SETTINGS,
  notifications: {
    email: true,
    inApp: true,
    agentAlerts: true,
  },
  ai: {
    model: getDefaultLlmModel(),
    autoQualify: true,
    suggestReplies: true,
  },
};
