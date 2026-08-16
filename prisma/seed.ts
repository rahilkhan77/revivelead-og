import {
  IntentType,
  LeadStatus,
  LeadTemperature,
  PrismaClient,
  Role,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, subDays, subHours } from "date-fns";
import { DEFAULT_ORG_SETTINGS } from "../src/lib/constants";
import { publicWidgetKey } from "../src/lib/crypto/hash";
import { normalizeEmail, normalizePhone } from "../src/lib/leads/normalize";

const db = new PrismaClient();

type SeedLead = {
  name: string;
  phone: string;
  email: string;
  source: string;
  propertyType: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  intent: IntentType;
  timeline: string;
  bedrooms: number;
  score: number;
  temperature: LeadTemperature;
  status: LeadStatus;
  notes: string;
  daysAgo: number;
  lastContactDays?: number;
  nextFollowHours?: number;
  reactivated?: boolean;
  estimatedValue: number;
  currency?: string;
  agentEmail: string;
  conversation?: { inbound: boolean; body: string; hoursAgo: number }[];
};

const leads: SeedLead[] = [
  {
    name: "Hassan Al Maktoum",
    phone: "+971501110001",
    email: "hassan.alm@example.com",
    source: "Property Finder",
    propertyType: "Penthouse",
    location: "Downtown Dubai",
    budgetMin: 8500000,
    budgetMax: 12000000,
    intent: "BUYING",
    timeline: "This month",
    bedrooms: 4,
    score: 92,
    temperature: "HOT",
    status: "NEGOTIATION",
    notes: "Wants Burj Khalifa view. Cash buyer.",
    daysAgo: 6,
    lastContactDays: 0,
    estimatedValue: 11000000,
    agentEmail: "omar@alnoor.ae",
    conversation: [
      { inbound: true, body: "I am looking for a 4-bed penthouse in Downtown Dubai with Burj Khalifa view. Cash buyer, budget up to AED 12M. Can you send options today?", hoursAgo: 140 },
      { inbound: false, body: "Hassan — two residences match: Opera District, 4-bed, AED 11.2M, and Address Fountain Views, AED 10.8M. Both vacant. Can we view tomorrow at 5pm?", hoursAgo: 138 },
      { inbound: true, body: "Tomorrow 5pm works. Please send floor plans and service charges. I want to move before Ramadan.", hoursAgo: 20 },
    ],
  },
  {
    name: "Amelia Chen",
    phone: "+971502220002",
    email: "amelia.chen@example.com",
    source: "Website",
    propertyType: "Apartment",
    location: "Dubai Marina",
    budgetMin: 1800000,
    budgetMax: 2400000,
    intent: "BUYING",
    timeline: "1-3 months",
    bedrooms: 2,
    score: 81,
    temperature: "HOT",
    status: "VIEWING_SCHEDULED",
    notes: "Relocating from Singapore. Wants marina walkability.",
    daysAgo: 3,
    lastContactDays: 1,
    estimatedValue: 2200000,
    agentEmail: "priya@alnoor.ae",
    conversation: [
      { inbound: true, body: "Hi, do you have 2-bed apartments in Dubai Marina under AED 2.4M with a gym, pool and two parking spaces? Relocating from Singapore next month.", hoursAgo: 70 },
      { inbound: false, body: "Yes Amelia — Marina Gate (AED 2.28M, marina view) and Sparkle Towers (AED 2.15M). I can hold Saturday 11am at the Marina Walk entrance.", hoursAgo: 68 },
      { inbound: true, body: "Saturday 11am is fine. Please include service charge and if the seller will include furniture.", hoursAgo: 30 },
    ],
  },
  {
    name: "Rahul Mehta",
    phone: "+971503330003",
    email: "rahul.mehta@example.com",
    source: "Bayut",
    propertyType: "Villa",
    location: "Dubai Hills",
    budgetMin: 6500000,
    budgetMax: 7800000,
    intent: "BUYING",
    timeline: "ASAP",
    bedrooms: 5,
    score: 88,
    temperature: "HOT",
    status: "QUALIFIED",
    notes: "Family moving from Mumbai. School proximity is critical.",
    conversation: [
      { inbound: true, body: "We need a 5-bed villa in Dubai Hills close to GEMS. Budget AED 6.5–7.8M. Can we view this week?", hoursAgo: 40 },
      { inbound: false, body: "Rahul — I have two golf-view villas, both vacant. Thursday 4:30pm or Friday 11am. Which works?", hoursAgo: 38 },
    ],
    daysAgo: 2,
    lastContactDays: 0,
    estimatedValue: 7200000,
    agentEmail: "james@alnoor.ae",
  },
  {
    name: "Layla Haddad",
    phone: "+971504440004",
    email: "layla.haddad@example.com",
    source: "Instagram",
    propertyType: "Apartment",
    location: "Business Bay",
    budgetMin: 1400000,
    budgetMax: 1750000,
    intent: "BUYING",
    timeline: "This week",
    bedrooms: 1,
    score: 79,
    temperature: "HOT",
    status: "CONTACTED",
    notes: "First-time buyer. Asked about payment plans.",
    daysAgo: 1,
    lastContactDays: 0,
    nextFollowHours: 3,
    estimatedValue: 1600000,
    agentEmail: "omar@alnoor.ae",
  },
  {
    name: "Thomas Berger",
    phone: "+971505550005",
    email: "thomas.berger@example.com",
    source: "Referral",
    propertyType: "Villa",
    location: "Palm Jumeirah",
    budgetMin: 18000000,
    budgetMax: 25000000,
    intent: "BUYING",
    timeline: "3-6 months",
    bedrooms: 6,
    score: 74,
    temperature: "WARM",
    status: "QUALIFIED",
    notes: "Comparing frond villas. Privacy is the objection.",
    daysAgo: 10,
    lastContactDays: 2,
    estimatedValue: 22000000,
    agentEmail: "fatima@alnoor.ae",
  },
  {
    name: "Noor Al Thani",
    phone: "+97455111001",
    email: "noor.althani@example.com",
    source: "Website",
    propertyType: "Apartment",
    location: "Lusail, Qatar",
    budgetMin: 2200000,
    budgetMax: 3000000,
    intent: "BUYING",
    timeline: "1-3 months",
    bedrooms: 3,
    score: 70,
    temperature: "WARM",
    status: "CONTACTED",
    notes: "Qatari investor looking at Lusail waterfront.",
    daysAgo: 5,
    lastContactDays: 1,
    estimatedValue: 2800000,
    agentEmail: "priya@alnoor.ae",
  },
  {
    name: "Sanjay Kapoor",
    phone: "+919820011001",
    email: "sanjay.kapoor@example.com",
    source: "Google Ads",
    propertyType: "Apartment",
    location: "Bandra West, Mumbai",
    budgetMin: 45000000,
    budgetMax: 70000000,
    intent: "BUYING",
    timeline: "6 months",
    bedrooms: 3,
    score: 61,
    temperature: "WARM",
    status: "NEW",
    notes: "Budget in INR. Wants sea-facing Bandra inventory.",
    currency: "INR",
    daysAgo: 0,
    nextFollowHours: 1,
    estimatedValue: 60000000,
    agentEmail: "james@alnoor.ae",
  },
  {
    name: "Aisha Rahman",
    phone: "+971506660006",
    email: "aisha.rahman@example.com",
    source: "Walk-in",
    propertyType: "Townhouse",
    location: "Arabian Ranches",
    budgetMin: 3200000,
    budgetMax: 3900000,
    intent: "BUYING",
    timeline: "1-3 months",
    bedrooms: 3,
    score: 67,
    temperature: "WARM",
    status: "VIEWING_SCHEDULED",
    notes: "Community feel and parks for kids.",
    daysAgo: 4,
    lastContactDays: 1,
    estimatedValue: 3600000,
    agentEmail: "priya@alnoor.ae",
  },
  {
    name: "Daniel Okonkwo",
    phone: "+971507770007",
    email: "daniel.ok@example.com",
    source: "Bayut",
    propertyType: "Apartment",
    location: "JVC",
    budgetMin: 850000,
    budgetMax: 1100000,
    intent: "BUYING",
    timeline: "This quarter",
    bedrooms: 1,
    score: 58,
    temperature: "WARM",
    status: "CONTACTED",
    notes: "Investor looking at yield.",
    daysAgo: 8,
    lastContactDays: 3,
    estimatedValue: 980000,
    agentEmail: "omar@alnoor.ae",
  },
  {
    name: "Maya Krishnan",
    phone: "+919845522001",
    email: "maya.k@example.com",
    source: "Referral",
    propertyType: "Apartment",
    location: "Whitefield, Bangalore",
    currency: "INR",
    budgetMin: 18000000,
    budgetMax: 24000000,
    intent: "BUYING",
    timeline: "3 months",
    bedrooms: 3,
    score: 64,
    temperature: "WARM",
    status: "QUALIFIED",
    notes: "IT professional. Wants ready-to-move.",
    daysAgo: 7,
    lastContactDays: 2,
    estimatedValue: 21000000,
    agentEmail: "james@alnoor.ae",
  },
  {
    name: "Pierre Laurent",
    phone: "+971508880008",
    email: "pierre.l@example.com",
    source: "Property Finder",
    propertyType: "Penthouse",
    location: "Palm Jumeirah",
    budgetMin: 14000000,
    budgetMax: 18000000,
    intent: "BUYING",
    timeline: "Flexible",
    bedrooms: 4,
    score: 55,
    temperature: "WARM",
    status: "NEGOTIATION",
    notes: "Comparing with another agency. Price objection.",
    daysAgo: 12,
    lastContactDays: 1,
    estimatedValue: 16500000,
    agentEmail: "fatima@alnoor.ae",
  },
  {
    name: "Fatema Qureshi",
    phone: "+971509990009",
    email: "fatema.q@example.com",
    source: "WhatsApp",
    propertyType: "Studio",
    location: "Business Bay",
    budgetMin: 700000,
    budgetMax: 850000,
    intent: "BUYING",
    timeline: "This year",
    bedrooms: 0,
    score: 44,
    temperature: "COLD",
    status: "NEW",
    notes: "Just browsing payment plans.",
    daysAgo: 0,
    estimatedValue: 800000,
    agentEmail: "omar@alnoor.ae",
  },
  {
    name: "Oliver Grant",
    phone: "+971501234010",
    email: "oliver.grant@example.com",
    source: "Website",
    propertyType: "Apartment",
    location: "Dubai Marina",
    budgetMin: 90000,
    budgetMax: 130000,
    intent: "RENTING",
    timeline: "Next month",
    bedrooms: 2,
    score: 52,
    temperature: "WARM",
    status: "CONTACTED",
    notes: "Annual rent budget. Corporate relocation.",
    daysAgo: 2,
    lastContactDays: 1,
    estimatedValue: 120000,
    agentEmail: "priya@alnoor.ae",
  },
  {
    name: "Huda Al Suwaidi",
    phone: "+971501234011",
    email: "huda.suwaidi@example.com",
    source: "Referral",
    propertyType: "Villa",
    location: "Emirates Hills",
    budgetMin: 28000000,
    budgetMax: 35000000,
    intent: "BUYING",
    timeline: "This quarter",
    bedrooms: 7,
    score: 86,
    temperature: "HOT",
    status: "WON",
    notes: "Closed last week after reactivation last quarter.",
    daysAgo: 40,
    lastContactDays: 4,
    reactivated: true,
    estimatedValue: 32000000,
    agentEmail: "fatima@alnoor.ae",
  },
  {
    name: "Kenji Sato",
    phone: "+971501234012",
    email: "kenji.sato@example.com",
    source: "Google Ads",
    propertyType: "Apartment",
    location: "Downtown Dubai",
    budgetMin: 2100000,
    budgetMax: 2600000,
    intent: "BUYING",
    timeline: "2 months",
    bedrooms: 2,
    score: 71,
    temperature: "WARM",
    status: "WON",
    notes: "Bought Boulevard Point after 45 days dormant.",
    daysAgo: 55,
    lastContactDays: 8,
    reactivated: true,
    estimatedValue: 2450000,
    agentEmail: "omar@alnoor.ae",
  },
  {
    name: "Nadia El Masri",
    phone: "+971501234013",
    email: "nadia.elmasri@example.com",
    source: "Bayut",
    propertyType: "Townhouse",
    location: "Dubai Hills",
    budgetMin: 4100000,
    budgetMax: 4700000,
    intent: "BUYING",
    timeline: "Was 2025",
    bedrooms: 4,
    score: 48,
    temperature: "COLD",
    status: "DORMANT",
    notes: "Went quiet after first viewing.",
    daysAgo: 62,
    lastContactDays: 51,
    estimatedValue: 4400000,
    agentEmail: "james@alnoor.ae",
    conversation: [
      { inbound: true, body: "Can we see the golf-view townhouse this weekend?", hoursAgo: 1500 },
      { inbound: false, body: "Confirmed Saturday 4pm. I will meet you at the sales centre.", hoursAgo: 1490 },
    ],
  },
  {
    name: "Ibrahim Youssef",
    phone: "+971501234014",
    email: "ibrahim.y@example.com",
    source: "Property Finder",
    propertyType: "Apartment",
    location: "Dubai Creek Harbour",
    budgetMin: 1600000,
    budgetMax: 1900000,
    intent: "BUYING",
    timeline: "Unknown",
    bedrooms: 2,
    score: 41,
    temperature: "COLD",
    status: "DORMANT",
    notes: "No reply for 40 days.",
    daysAgo: 48,
    lastContactDays: 41,
    estimatedValue: 1750000,
    agentEmail: "priya@alnoor.ae",
  },
  {
    name: "Sophie Laurent",
    phone: "+971501234015",
    email: "sophie.laurent@example.com",
    source: "Instagram",
    propertyType: "Apartment",
    location: "City Walk",
    budgetMin: 2300000,
    budgetMax: 2800000,
    intent: "BUYING",
    timeline: "Paused",
    bedrooms: 2,
    score: 39,
    temperature: "COLD",
    status: "DORMANT",
    notes: "Traveling in Europe. Asked to reconnect later.",
    daysAgo: 70,
    lastContactDays: 55,
    estimatedValue: 2500000,
    agentEmail: "omar@alnoor.ae",
  },
  {
    name: "Arjun Nair",
    phone: "+971501234016",
    email: "arjun.nair@example.com",
    source: "Website",
    propertyType: "Villa",
    location: "Damac Hills",
    budgetMin: 3800000,
    budgetMax: 4500000,
    intent: "BUYING",
    timeline: "Was urgent, then silent",
    bedrooms: 4,
    score: 46,
    temperature: "COLD",
    status: "DORMANT",
    notes: "Strong initial intent, then disappeared.",
    daysAgo: 38,
    lastContactDays: 33,
    estimatedValue: 4200000,
    agentEmail: "james@alnoor.ae",
  },
  {
    name: "Elena Petrova",
    phone: "+971501234017",
    email: "elena.p@example.com",
    source: "Referral",
    propertyType: "Penthouse",
    location: "Bluewaters",
    budgetMin: 9000000,
    budgetMax: 11000000,
    intent: "BUYING",
    timeline: "Next year",
    bedrooms: 3,
    score: 50,
    temperature: "WARM",
    status: "DORMANT",
    notes: "Waiting for school decision.",
    daysAgo: 90,
    lastContactDays: 61,
    estimatedValue: 10000000,
    agentEmail: "fatima@alnoor.ae",
  },
  {
    name: "Mohammed Farooq",
    phone: "+971501234018",
    email: "m.farooq@example.com",
    source: "Walk-in",
    propertyType: "Office",
    location: "DIFC",
    budgetMin: 2500000,
    budgetMax: 4000000,
    intent: "BUYING",
    timeline: "This year",
    bedrooms: 0,
    score: 57,
    temperature: "WARM",
    status: "LOST",
    notes: "Chose a competitor after slow follow-up.",
    daysAgo: 80,
    lastContactDays: 70,
    estimatedValue: 3200000,
    agentEmail: "omar@alnoor.ae",
  },
  {
    name: "Clara Mendes",
    phone: "+971501234019",
    email: "clara.m@example.com",
    source: "Bayut",
    propertyType: "Apartment",
    location: "JBR",
    budgetMin: 1900000,
    budgetMax: 2300000,
    intent: "BUYING",
    timeline: "Summer",
    bedrooms: 2,
    score: 43,
    temperature: "COLD",
    status: "LOST",
    notes: "Budget reduced after job change.",
    daysAgo: 100,
    lastContactDays: 85,
    estimatedValue: 2100000,
    agentEmail: "priya@alnoor.ae",
  },
  {
    name: "Yusuf Al Falasi",
    phone: "+971501234020",
    email: "yusuf.falasi@example.com",
    source: "Referral",
    propertyType: "Villa",
    location: "Al Barari",
    budgetMin: 12000000,
    budgetMax: 16000000,
    intent: "BUYING",
    timeline: "This quarter",
    bedrooms: 5,
    score: 83,
    temperature: "HOT",
    status: "VIEWING_SCHEDULED",
    notes: "Wants landscaped privacy and wellness amenities.",
    daysAgo: 3,
    lastContactDays: 0,
    estimatedValue: 14500000,
    agentEmail: "fatima@alnoor.ae",
  },
  {
    name: "Priyanka Desai",
    phone: "+971501234021",
    email: "priyanka.d@example.com",
    source: "Property Finder",
    propertyType: "Apartment",
    location: "Dubai Hills",
    budgetMin: 1500000,
    budgetMax: 1850000,
    intent: "BUYING",
    timeline: "1-3 months",
    bedrooms: 2,
    score: 66,
    temperature: "WARM",
    status: "QUALIFIED",
    notes: "Prefers park view over golf view.",
    daysAgo: 5,
    lastContactDays: 1,
    estimatedValue: 1700000,
    agentEmail: "james@alnoor.ae",
  },
  {
    name: "Marcus Holm",
    phone: "+971501234022",
    email: "marcus.holm@example.com",
    source: "Website",
    propertyType: "Apartment",
    location: "Dubai Marina",
    budgetMin: 110000,
    budgetMax: 140000,
    intent: "RENTING",
    timeline: "Immediate",
    bedrooms: 2,
    score: 73,
    temperature: "WARM",
    status: "NEGOTIATION",
    notes: "Corporate lease, 2-year term.",
    daysAgo: 9,
    lastContactDays: 0,
    estimatedValue: 135000,
    agentEmail: "priya@alnoor.ae",
  },
  {
    name: "Sara Al Nuaimi",
    phone: "+971501234023",
    email: "sara.nuaimi@example.com",
    source: "Instagram",
    propertyType: "Townhouse",
    location: "Tilal Al Ghaf",
    budgetMin: 3600000,
    budgetMax: 4200000,
    intent: "BUYING",
    timeline: "This month",
    bedrooms: 4,
    score: 77,
    temperature: "HOT",
    status: "CONTACTED",
    notes: "Wants water-lagoon community.",
    daysAgo: 1,
    lastContactDays: 0,
    nextFollowHours: 2,
    estimatedValue: 4000000,
    agentEmail: "omar@alnoor.ae",
  },
  {
    name: "David Cohen",
    phone: "+971501234024",
    email: "david.cohen@example.com",
    source: "Google Ads",
    propertyType: "Office",
    location: "Business Bay",
    budgetMin: 1800000,
    budgetMax: 2500000,
    intent: "BUYING",
    timeline: "6 months",
    bedrooms: 0,
    score: 49,
    temperature: "COLD",
    status: "NEW",
    notes: "Fit-out cost is the objection.",
    daysAgo: 0,
    estimatedValue: 2200000,
    agentEmail: "james@alnoor.ae",
  },
  {
    name: "Ananya Rao",
    phone: "+919900112233",
    email: "ananya.rao@example.com",
    source: "Website",
    propertyType: "Apartment",
    location: "Koramangala, Bangalore",
    currency: "INR",
    budgetMin: 22000000,
    budgetMax: 28000000,
    intent: "BUYING",
    timeline: "This year",
    bedrooms: 3,
    score: 54,
    temperature: "WARM",
    status: "CONTACTED",
    notes: "Comparing with Whitefield inventory.",
    daysAgo: 6,
    lastContactDays: 2,
    estimatedValue: 25000000,
    agentEmail: "priya@alnoor.ae",
  },
  {
    name: "Khalid Mansour",
    phone: "+97455222002",
    email: "khalid.mansour@example.com",
    source: "Referral",
    propertyType: "Villa",
    location: "The Pearl, Qatar",
    budgetMin: 7000000,
    budgetMax: 9000000,
    intent: "BUYING",
    timeline: "3-6 months",
    bedrooms: 5,
    score: 68,
    temperature: "WARM",
    status: "QUALIFIED",
    notes: "Wants a second home near the marina.",
    daysAgo: 11,
    lastContactDays: 3,
    estimatedValue: 8200000,
    agentEmail: "fatima@alnoor.ae",
  },
  {
    name: "Helena Costa",
    phone: "+971501234025",
    email: "helena.costa@example.com",
    source: "Portal import",
    propertyType: "Apartment",
    location: "Dubai Harbour",
    budgetMin: 2700000,
    budgetMax: 3300000,
    intent: "BUYING",
    timeline: "ASAP",
    bedrooms: 2,
    score: 84,
    temperature: "HOT",
    status: "NEW",
    notes: "Inbound this morning. No one has called yet.",
    daysAgo: 0,
    nextFollowHours: 0,
    estimatedValue: 3100000,
    agentEmail: "omar@alnoor.ae",
    conversation: [
      { inbound: true, body: "I submitted a form for a 2-bed in Dubai Harbour. Budget AED 3.1M, need it ASAP. Please call me today — I have not heard from anyone.", hoursAgo: 1 },
    ],
  },
];

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "yes") {
    throw new Error(
      "Refusing to seed Al Noor demo data in production. Set ALLOW_DEMO_SEED=yes only if you explicitly want the demo tenant.",
    );
  }

  await db.campaignRecipient.deleteMany();
  await db.campaign.deleteMany();
  await db.automationExecution.deleteMany();
  await db.automation.deleteMany();
  await db.followUp.deleteMany();
  await db.leadMessage.deleteMany();
  await db.revenueEvent.deleteMany();
  await db.notification.deleteMany();
  await db.property.deleteMany();
  await db.lead.deleteMany();
  await db.invitation.deleteMany();
  await db.integration.deleteMany();
  await db.subscription.deleteMany();
  await db.auditLog.deleteMany();
  await db.agent.deleteMany();
  await db.membership.deleteMany();
  await db.organization.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await hash("Demo1234!", 12);

  const users = await Promise.all(
    [
      { name: "Mariam Al Noor", email: "owner@alnoor.ae", role: "OWNER" as Role },
      { name: "Fatima Al Hashimi", email: "fatima@alnoor.ae", role: "SALES_MANAGER" as Role },
      { name: "Omar Khalid", email: "omar@alnoor.ae", role: "SALES_AGENT" as Role },
      { name: "Priya Sharma", email: "priya@alnoor.ae", role: "SALES_AGENT" as Role },
      { name: "James Whitfield", email: "james@alnoor.ae", role: "SALES_AGENT" as Role },
    ].map((item) =>
      db.user.create({
        data: { name: item.name, email: item.email, passwordHash },
      }),
    ),
  );

  const byEmail = Object.fromEntries(users.map((user) => [user.email, user]));

  const org = await db.organization.create({
    data: {
      name: "Al Noor Properties",
      slug: "al-noor-properties",
      market: "Dubai",
      country: "UAE",
      timezone: "Asia/Dubai",
      currency: "AED",
      isDemo: true,
      onboardingCompleted: true,
      widgetKey: publicWidgetKey(),
      settings: JSON.stringify(DEFAULT_ORG_SETTINGS),
    },
  });

  await Promise.all(
    [
      { email: "owner@alnoor.ae", role: "OWNER" as Role },
      { email: "fatima@alnoor.ae", role: "SALES_MANAGER" as Role },
      { email: "omar@alnoor.ae", role: "SALES_AGENT" as Role },
      { email: "priya@alnoor.ae", role: "SALES_AGENT" as Role },
      { email: "james@alnoor.ae", role: "SALES_AGENT" as Role },
    ].map((item) =>
      db.membership.create({
        data: {
          userId: byEmail[item.email].id,
          organizationId: org.id,
          role: item.role,
        },
      }),
    ),
  );

  await db.subscription.create({
    data: {
      organizationId: org.id,
      plan: "PRO",
      status: "ACTIVE",
      seats: 15,
      leadLimit: 2000,
      automationLimit: 25,
      whatsappMonthlyLimit: 2000,
      currentPeriodEnd: addDays(new Date(), 26),
    },
  });

  await db.integration.createMany({
    data: [
      {
        organizationId: org.id,
        type: "WHATSAPP",
        name: "WhatsApp Business",
        enabled: false,
        config: JSON.stringify({ secret: "demo-whatsapp-secret" }),
      },
      { organizationId: org.id, type: "EMAIL", name: "Transactional email", enabled: false, config: "{}" },
      {
        organizationId: org.id,
        type: "WEBHOOK",
        name: "Outbound webhook",
        enabled: false,
        config: JSON.stringify({ url: "", secret: "demo-webhook-secret" }),
      },
      {
        organizationId: org.id,
        type: "N8N",
        name: "n8n",
        enabled: false,
        config: JSON.stringify({ url: "", secret: "demo-n8n-secret" }),
      },
    ],
  });

  await db.automation.createMany({
    data: [
      {
        organizationId: org.id,
        name: "Immediate WhatsApp on new lead",
        trigger: "LEAD_CREATED",
        action: "SEND_WHATSAPP",
        config: JSON.stringify({
          message: "Thank you for contacting Al Noor Properties. An advisor will share matching options shortly.",
        }),
      },
      {
        organizationId: org.id,
        name: "Notify agent on new lead",
        trigger: "LEAD_CREATED",
        action: "NOTIFY_AGENT",
        config: JSON.stringify({ title: "New lead assigned" }),
      },
      {
        organizationId: org.id,
        name: "Hot lead alert",
        trigger: "LEAD_BECOMES_HOT",
        action: "NOTIFY_AGENT",
        config: JSON.stringify({ title: "Hot lead — call now" }),
      },
    ],
  });

  for (const item of leads) {
    const agent = byEmail[item.agentEmail];
    const createdAt = subDays(new Date(), item.daysAgo);
    const lastContactedAt =
      item.lastContactDays != null ? subDays(new Date(), item.lastContactDays) : null;
    const nextFollowUpAt =
      item.nextFollowHours != null ? subHours(new Date(), -item.nextFollowHours) : null;

    const lead = await db.lead.create({
      data: {
        organizationId: org.id,
        name: item.name,
        phone: item.phone,
        email: item.email,
        phoneNormalized: normalizePhone(item.phone),
        emailNormalized: normalizeEmail(item.email),
        source: item.source,
        propertyType: item.propertyType,
        location: item.location,
        budgetMin: item.budgetMin,
        budgetMax: item.budgetMax,
        intent: item.intent,
        timeline: item.timeline,
        bedrooms: item.bedrooms,
        leadScore: item.score,
        temperature: item.temperature,
        status: item.status,
        assignedAgentId: agent.id,
        lastContactedAt,
        nextFollowUpAt,
        notes: item.notes,
        recommendedAction:
          item.temperature === "HOT"
            ? "Call within 15 minutes and lock a viewing."
            : item.temperature === "WARM"
              ? "Send two matching listings and propose times."
              : "Reactivate with a personalised market update.",
        isReactivated: Boolean(item.reactivated),
        reactivatedAt: item.reactivated ? subDays(createdAt, -20) : null,
        estimatedValue: item.estimatedValue,
        currency: item.currency ?? "AED",
        createdAt,
        updatedAt: lastContactedAt ?? createdAt,
      },
    });

    if (item.conversation) {
      for (const message of item.conversation) {
        await db.leadMessage.create({
          data: {
            organizationId: org.id,
            leadId: lead.id,
            direction: message.inbound ? "INBOUND" : "OUTBOUND",
            channel: "WHATSAPP",
            body: message.body,
            createdAt: subHours(new Date(), message.hoursAgo),
          },
        });
      }
    }

    if (["NEW", "CONTACTED", "QUALIFIED"].includes(item.status)) {
      await db.followUp.create({
        data: {
          organizationId: org.id,
          leadId: lead.id,
          type: item.status === "NEW" ? "NEW_LEAD_RESPONSE" : "NO_RESPONSE",
          status: "PENDING",
          dueAt: nextFollowUpAt ?? new Date(),
          assignedToId: agent.id,
          message: `Follow up with ${item.name} about ${item.propertyType} in ${item.location}.`,
        },
      });
    }

    if (item.status === "WON") {
      await db.revenueEvent.create({
        data: {
          organizationId: org.id,
          leadId: lead.id,
          type: item.reactivated ? "reactivated_won" : "won",
          amount: item.estimatedValue,
          note: item.reactivated
            ? "Recovered from dormant pipeline"
            : "New opportunity closed",
          createdAt: lastContactedAt ?? createdAt,
        },
      });
    }
  }

  const dormant = await db.lead.findMany({
    where: { organizationId: org.id, status: "DORMANT" },
  });
  const campaign = await db.campaign.create({
    data: {
      organizationId: org.id,
      name: "30-day dormant — Dubai spring reactivation",
      status: "SENT",
      filterDays: 30,
      createdById: byEmail["fatima@alnoor.ae"].id,
      sentAt: subDays(new Date(), 4),
    },
  });
  for (const lead of dormant.slice(0, 3)) {
    await db.campaignRecipient.create({
      data: {
        campaignId: campaign.id,
        leadId: lead.id,
        status: "SENT",
        sentAt: subDays(new Date(), 4),
        message: `Hi ${lead.name}, inventory in ${lead.location} has moved. I have two ${lead.propertyType?.toLowerCase()} options that match your brief. Shall I send them today?`,
      },
    });
  }

  await db.notification.createMany({
    data: [
      {
        organizationId: org.id,
        userId: byEmail["omar@alnoor.ae"].id,
        type: "NEW_LEAD",
        title: "New lead: Helena Costa",
        body: "Call within 15 minutes — Dubai Harbour, 2-bed, ASAP.",
        link: "/leads",
      },
      {
        organizationId: org.id,
        userId: byEmail["fatima@alnoor.ae"].id,
        type: "FOLLOW_UP_DUE",
        title: "5 follow-ups due today",
        body: "Your team has unanswered high-value leads.",
        link: "/follow-ups",
      },
    ],
  });

  await db.property.createMany({
    data: [
      {
        organizationId: org.id,
        title: "Opera District Penthouse",
        type: "Penthouse",
        location: "Downtown Dubai",
        city: "Dubai",
        country: "UAE",
        bedrooms: 4,
        bathrooms: 5,
        price: 11200000,
        status: "AVAILABLE",
        description: "Burj Khalifa view penthouse. Vacant.",
      },
      {
        organizationId: org.id,
        title: "Marina Gate Residence",
        type: "Apartment",
        location: "Dubai Marina",
        city: "Dubai",
        country: "UAE",
        bedrooms: 2,
        bathrooms: 2,
        price: 2280000,
        status: "AVAILABLE",
        description: "Marina view, two parking spaces.",
      },
      {
        organizationId: org.id,
        title: "Sparkle Towers 2 Bed",
        type: "Apartment",
        location: "Dubai Marina",
        city: "Dubai",
        country: "UAE",
        bedrooms: 2,
        bathrooms: 2,
        price: 2150000,
        status: "AVAILABLE",
      },
    ],
  });

  console.log("Seeded Al Noor Properties demo.");
  console.log("Login: owner@alnoor.ae / Demo1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
