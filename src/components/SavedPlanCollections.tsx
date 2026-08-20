import { useState } from 'react';
import type { RecommendationTier, TripPlan } from '../lib/aiPlanner';
import { useI18n } from '../i18n/I18nProvider';
import { languageLocale } from '../i18n/locale';
import { countRecommendationTiers, filterByRecommendationTier, recommendationTier, type RecommendationTierFilterValue } from '../lib/recommendationTiers';
import { RecommendationPhoto } from './RecommendationPhoto';
import { RecommendationTierFilter } from './RecommendationTierFilter';

function TierBadge({ tier }: { tier?: RecommendationTier }) {
  const { t } = useI18n();
  const resolved = recommendationTier(tier);
  return <span className={`recommendation-tier recommendation-tier--${resolved}`}>{t(`extras.tier.${resolved}`)}</span>;
}

export function SavedAccommodations({ plan }: { plan: TripPlan }) {
  const { t, language } = useI18n();
  const [tier, setTier] = useState<RecommendationTierFilterValue>('all');
  const items = filterByRecommendationTier(plan.accommodations, tier);
  return <><RecommendationTierFilter value={tier} counts={countRecommendationTiers(plan.accommodations)} onChange={setTier} /><div className="saved-card-grid saved-card-grid--large">{items.map((item, index) => <article key={`${item.name}-${index}`}><RecommendationPhoto name={item.name} photo={item.photo} /><TierBadge tier={item.tier} /><small>{item.type} · {item.area}</small><h3>{item.name}</h3><strong>{item.pricePerNight.toLocaleString(languageLocale(language))} {plan.budget.currency} {t('extras.perNight')}</strong><p>{item.description}</p></article>)}</div></>;
}

export function SavedFood({ plan }: { plan: TripPlan }) {
  const [tier, setTier] = useState<RecommendationTierFilterValue>('all');
  const items = filterByRecommendationTier(plan.food, tier);
  return <><RecommendationTierFilter value={tier} counts={countRecommendationTiers(plan.food)} onChange={setTier} /><div className="saved-card-grid">{items.map((item, index) => <article key={`${item.name}-${index}`}><RecommendationPhoto name={item.name} photo={item.photo} /><TierBadge tier={item.tier} /><small>{item.cuisine} · {item.priceLevel}</small><h3>{item.name}</h3><p>{item.description}</p></article>)}</div></>;
}

export function SavedActivities({ plan }: { plan: TripPlan }) {
  const [tier, setTier] = useState<RecommendationTierFilterValue>('all');
  const items = filterByRecommendationTier(plan.activities, tier);
  return <><RecommendationTierFilter value={tier} counts={countRecommendationTiers(plan.activities)} onChange={setTier} /><div className="saved-card-grid">{items.map((item, index) => <article key={`${item.name}-${index}`}><RecommendationPhoto name={item.name} photo={item.photo} /><TierBadge tier={item.tier} /><small>{item.category}</small><h3>{item.name}</h3><p>{item.summary}</p></article>)}</div></>;
}

export function SavedUsefulLinks({ plan }: { plan: TripPlan }) {
  return <div className="saved-link-list">{plan.usefulLinks.map((item, index) => <article key={`${item.title}-${index}`}><span aria-hidden="true">i</span><div><h3>{item.title}</h3><p>{item.recommendation}</p></div></article>)}</div>;
}

export function SavedChecklist({ plan }: { plan: TripPlan }) {
  return <ol className="saved-checklist">{plan.checklist.map((item, index) => <li key={`${item.task}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{item.timing}</small><h3>{item.task}</h3><p>{item.details}</p></div></li>)}</ol>;
}
