export type PlannerLanguage = 'ru' | 'en' | 'kk';

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
};

export type ClarificationQuestion = { id: string; text: string };
export type ClarificationTurn = { questions: ClarificationQuestion[]; answer: string };
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

export type TripActivity = {
  time: string;
  title: string;
  place: string;
  area: string;
  description: string;
  estimatedCost: number;
  durationMinutes: number;
  travelMinutesFromPrevious: number;
};

export type TripDay = {
  day: number;
  date: string;
  pace: 'active' | 'balanced' | 'rest';
  title: string;
  activities: TripActivity[];
};

export type PlaceIdea = {
  name: string;
  type: string;
  description: string;
};

export type BudgetCategory = {
  category: string;
  amount: number;
  note: string;
};

export type TransportOption = {
  mode: string;
  route: string;
  recommendation: string;
};

export type RecommendationTier = 'budget' | 'comfortable' | 'luxury';
export type RecommendationPhoto = { url: string; sourceUrl?: string; credit: string };

export type AccommodationOption = {
  name: string;
  area: string;
  type: string;
  pricePerNight: number;
  description: string;
  tier?: RecommendationTier;
  photo?: RecommendationPhoto;
};

export type FoodRecommendation = {
  name: string;
  cuisine: string;
  priceLevel: string;
  description: string;
  tier?: RecommendationTier;
  photo?: RecommendationPhoto;
};

export type ActivityOverview = { name: string; category: string; summary: string; tier?: RecommendationTier; photo?: RecommendationPhoto };
export type UsefulRecommendation = { title: string; recommendation: string };
export type ChecklistItem = { task: string; timing: string; details: string };
export type RealismAssessment = {
  status: 'realistic' | 'adjusted';
  warning: string;
  adjustments: string[];
};

export type TripPlan = {
  title: string;
  destination: { city: string; country: string };
  days: TripDay[];
  placeIdeas: PlaceIdea[];
  budget: { currency: string; total: number; categories: BudgetCategory[] };
  transport: TransportOption[];
  accommodations: AccommodationOption[];
  food: FoodRecommendation[];
  activities: ActivityOverview[];
  usefulLinks: UsefulRecommendation[];
  checklist: ChecklistItem[];
  realism: RealismAssessment;
  rationale: string;
};

export type PlannerAIResult =
  | { status: 'success'; message: string; plan: TripPlan }
  | { status: 'budget_too_low'; message: string; plan: null };
