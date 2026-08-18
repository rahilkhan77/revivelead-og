export type QualificationInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  propertyType?: string | null;
  location?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  intent?: string | null;
  timeline?: string | null;
  bedrooms?: number | null;
  currency?: string | null;
  notes?: string | null;
  conversation?: string | null;
};

export type QualificationResult = {
  budgetMin: number | null;
  budgetMax: number | null;
  preferredLocation: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  currency: string | null;
  intent: "BUYING" | "RENTING" | "UNKNOWN";
  timeline: string | null;
  objections: string | null;
  leadScore: number;
  temperature: "HOT" | "WARM" | "COLD";
  recommendedAction: string;
  summary: string;
};

export type MessageSuggestionInput = {
  leadName: string;
  location?: string | null;
  propertyType?: string | null;
  intent?: string | null;
  lastMessages: string[];
  goal: "follow_up" | "reactivate" | "qualify" | "reply";
};

export interface LlmProvider {
  readonly name: string;
  generateJson<T>(system: string, user: string): Promise<T>;
  generateText(system: string, user: string): Promise<string>;
}
