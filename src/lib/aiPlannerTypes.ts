export type PlannerLanguage = 'ru' | 'en' | 'kk';
export type DeferredPlanSection = 'itinerary' | 'accommodations' | 'food' | 'activities' | 'usefulLinks' | 'checklist';

export type ClarificationQuestion = { id: string; text: string };
export type ClarificationTurn = { questions: ClarificationQuestion[]; answer: string };
export type ClarificationResult = {
  status: 'questions' | 'ready';
  message: string;
  originCity?: string;
  questions: ClarificationQuestion[];
};

export type TripSummary = {
  destination: string;
  originCity: string;
  dates: { start: string; end: string };
  durationDays: number;
  travelers: { count: number; ages: number[]; description: string };
  budget: { min: number; max: number; currency: string };
  interests: string[];
  pace: string;
  lodging: string;
  transport: string;
  constraints: string[];
  otherDetails: string[];
};

export type PlannerRequest = {
  prompt: string;
  responseLanguage?: PlannerLanguage;
  originCity?: string;
  dates?: { start: string; end: string };
  travelers?: number;
  travelerAges?: number[];
  priceRange?: { min: number; max: number; currency: string };
  clarifications?: ClarificationTurn[];
  summaryCorrections?: string[];
  confirmedSummary?: TripSummary;
  routeEdits?: string[];
  savedPreferences?: string[];
  deferredSections?: DeferredPlanSection[];
  expectedDays?: number;
};

export type GenerationProgress = {
  mode: 'standard' | 'chunked';
  phase: 'preparing' | 'days' | 'finalizing';
  completed: number;
  total: number;
  startDay?: number;
  endDay?: number;
};

export type RecommendationTier = 'budget' | 'comfortable' | 'luxury';
export type TripPlan = {
  title: string;
  destination: { city: string; country: string };
  days: Array<{
    day: number;
    title: string;
    activities: Array<{
      time: string; title: string; place: string; area: string; description: string;
      estimatedCost: number; durationMinutes: number; travelMinutesFromPrevious: number;
    }>;
    date: string;
    pace: 'active' | 'balanced' | 'rest';
  }>;
  placeIdeas: Array<{ name: string; type: string; description: string }>;
  budget: { currency: string; total: number; categories: Array<{ category: string; amount: number; note: string }> };
  transport: Array<{ mode: string; route: string; recommendation: string }>;
  accommodations: Array<{ name: string; area: string; type: string; pricePerNight: number; description: string; tier?: RecommendationTier }>;
  food: Array<{ name: string; cuisine: string; priceLevel: string; description: string; tier?: RecommendationTier }>;
  activities: Array<{ name: string; category: string; summary: string; tier?: RecommendationTier }>;
  usefulLinks: Array<{ title: string; recommendation: string }>;
  checklist: Array<{ task: string; timing: string; details: string }>;
  realism: { status: 'realistic' | 'adjusted'; warning: string; adjustments: string[] };
  rationale: string;
};

export type GeneratedTrip = { id: string; request: PlannerRequest; plan: TripPlan };
