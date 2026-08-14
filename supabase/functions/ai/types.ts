export type PlannerRequest = {
  prompt: string;
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

export type TripPlan = {
  title: string;
  destination: { city: string; country: string };
  days: TripDay[];
  placeIdeas: PlaceIdea[];
  budget: { currency: string; total: number; categories: BudgetCategory[] };
  rationale: string;
};

export type PlannerAIResult =
  | { status: 'success'; message: string; plan: TripPlan }
  | { status: 'budget_too_low'; message: string; plan: null };
