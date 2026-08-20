import type { RecommendationTier } from './aiPlanner';

export const recommendationTiers = ['budget', 'comfortable', 'luxury'] as const;
export type RecommendationTierFilterValue = 'all' | RecommendationTier;
export type RecommendationTierCounts = Record<RecommendationTierFilterValue, number>;

export function recommendationTier(value?: RecommendationTier, index = 0, total = 1): RecommendationTier {
  if (value && recommendationTiers.includes(value)) return value;
  const segment = Math.min(2, Math.floor(index * 3 / Math.max(1, total)));
  return recommendationTiers[segment];
}

export function filterByRecommendationTier<T extends { tier?: RecommendationTier }>(
  items: T[],
  selected: RecommendationTierFilterValue,
) {
  const categorized = items.map((item, index) => ({
    ...item,
    tier: recommendationTier(item.tier, index, items.length),
  }));
  return selected === 'all' ? categorized : categorized.filter((item) => item.tier === selected);
}

export function countRecommendationTiers<T extends { tier?: RecommendationTier }>(items: T[]) {
  const counts: RecommendationTierCounts = { all: items.length, budget: 0, comfortable: 0, luxury: 0 };
  items.forEach((item, index) => { counts[recommendationTier(item.tier, index, items.length)] += 1; });
  return counts;
}
