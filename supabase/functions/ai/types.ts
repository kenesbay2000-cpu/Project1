export type PlannerRequest = {
  prompt: string;
  originCity?: string;
  dates?: { start: string; end: string };
  travelers?: number;
  travelerAges?: number[];
  priceRange?: { min: number; max: number; currency: string };
};

export type TripActivity = {
  time: string;
  title: string;
  place: string;
  description: string;
  estimatedCost: number;
};

export type TripDay = {
  day: number;
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

export type AccommodationOption = {
  name: string;
  area: string;
  type: string;
  pricePerNight: number;
  description: string;
};

export type FoodRecommendation = {
  name: string;
  cuisine: string;
  priceLevel: string;
  description: string;
};

export type ActivityOverview = { name: string; category: string; summary: string };
export type UsefulRecommendation = { title: string; recommendation: string };
export type ChecklistItem = { task: string; timing: string; details: string };

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
  rationale: string;
};

export type PlannerAIResult =
  | { status: 'success'; message: string; plan: TripPlan }
  | { status: 'budget_too_low'; message: string; plan: null };
