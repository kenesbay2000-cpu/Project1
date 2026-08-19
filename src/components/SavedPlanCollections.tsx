import type { TripPlan } from '../lib/aiPlanner';
import { useI18n } from '../i18n/I18nProvider';

export function SavedAccommodations({ plan }: { plan: TripPlan }) {
  const { t, language } = useI18n();
  return <div className="saved-card-grid saved-card-grid--large">{plan.accommodations.map((item, index) => <article key={`${item.name}-${index}`}><small>{item.type} · {item.area}</small><h3>{item.name}</h3><strong>{item.pricePerNight.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')} {plan.budget.currency} {t('extras.perNight')}</strong><p>{item.description}</p></article>)}</div>;
}

export function SavedFood({ plan }: { plan: TripPlan }) {
  return <div className="saved-card-grid">{plan.food.map((item, index) => <article key={`${item.name}-${index}`}><small>{item.cuisine} · {item.priceLevel}</small><h3>{item.name}</h3><p>{item.description}</p></article>)}</div>;
}

export function SavedActivities({ plan }: { plan: TripPlan }) {
  return <div className="saved-card-grid">{plan.activities.map((item, index) => <article key={`${item.name}-${index}`}><small>{item.category}</small><h3>{item.name}</h3><p>{item.summary}</p></article>)}</div>;
}

export function SavedUsefulLinks({ plan }: { plan: TripPlan }) {
  return <div className="saved-link-list">{plan.usefulLinks.map((item, index) => <article key={`${item.title}-${index}`}><span aria-hidden="true">i</span><div><h3>{item.title}</h3><p>{item.recommendation}</p></div></article>)}</div>;
}

export function SavedChecklist({ plan }: { plan: TripPlan }) {
  return <ol className="saved-checklist">{plan.checklist.map((item, index) => <li key={`${item.task}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{item.timing}</small><h3>{item.task}</h3><p>{item.details}</p></div></li>)}</ol>;
}
