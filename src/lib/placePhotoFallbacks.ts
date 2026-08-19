import type { RecommendationTier } from './aiPlanner';

export type RecommendationPhotoKind = 'accommodation' | 'food' | 'activity';
export type RecommendationPhoto = {
  url: string;
  sourceUrl: string;
  credit: string;
  match: 'exact' | 'illustrative';
};

const photoIds: Record<RecommendationPhotoKind, Record<RecommendationTier, string>> = {
  accommodation: {
    budget: '1555854877-bab0e564b8d5',
    comfortable: '1566665797739-1674de7a421a',
    luxury: '1542314831-068cd1dbfeeb',
  },
  food: {
    budget: '1559314809-0d155014e29e',
    comfortable: '1517248135467-4c7edcad34c4',
    luxury: '1414235077428-338989a2e8c0',
  },
  activity: {
    budget: '1500534314209-a25ddb2bd429',
    comfortable: '1530789253388-582c481c54b0',
    luxury: '1540946485063-a40da27545f8',
  },
};

export function illustrativePhoto(kind: RecommendationPhotoKind, tier: RecommendationTier): RecommendationPhoto {
  const id = photoIds[kind][tier];
  const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=82`;
  return {
    url,
    sourceUrl: url,
    credit: 'Unsplash',
    match: 'illustrative',
  };
}
