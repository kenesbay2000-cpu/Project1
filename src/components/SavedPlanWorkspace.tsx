import { useRef, useState } from 'react';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { BudgetBreakdown } from './BudgetBreakdown';
import { SavedPlanOverview } from './SavedPlanOverview';
import { SavedPlanMap } from './SavedPlanMap';
import { SavedPlanWeather } from './SavedPlanWeather';
import { SavedPlanSidebar, type SavedPlanSectionId, savedPlanSections } from './SavedPlanSidebar';
import { SavedAccommodations, SavedActivities, SavedChecklist, SavedFood, SavedUsefulLinks } from './SavedPlanCollections';
import { TripDayCard } from './TripDayCard';
import './TripPlanResult.css';
import './SavedPlanWorkspace.css';
import './SavedPlanSections.css';
import { useI18n } from '../i18n/I18nProvider';

type SavedPlanWorkspaceProps = {
  trip: GeneratedTrip;
  onEdit?: () => void;
  onTripUpdated?: (trip: GeneratedTrip) => void;
};

export function SavedPlanWorkspace({ trip, onEdit, onTripUpdated }: SavedPlanWorkspaceProps) {
  const { t } = useI18n();
  const [active, setActive] = useState<SavedPlanSectionId>('overview');
  const content = useRef<HTMLDivElement>(null);
  const currentSection = savedPlanSections.find((section) => section.id === active) ?? savedPlanSections[0];
  const sectionCopy: Record<SavedPlanSectionId, { eyebrow: ReturnType<typeof t>; description: ReturnType<typeof t> | '' }> = {
    overview: { eyebrow: t('workspace.overviewEyebrow'), description: '' }, itinerary: { eyebrow: t('workspace.itineraryEyebrow'), description: t('workspace.itineraryDescription') },
    map: { eyebrow: t('workspace.mapEyebrow'), description: t('workspace.mapDescription') }, weather: { eyebrow: t('workspace.weatherEyebrow'), description: t('workspace.weatherDescription') },
    budget: { eyebrow: t('workspace.budgetEyebrow'), description: t('workspace.budgetDescription') }, accommodations: { eyebrow: t('workspace.staysEyebrow'), description: t('workspace.staysDescription') },
    food: { eyebrow: t('workspace.foodEyebrow'), description: t('workspace.foodDescription') }, activities: { eyebrow: t('workspace.activitiesEyebrow'), description: t('workspace.activitiesDescription') },
    useful: { eyebrow: t('workspace.usefulEyebrow'), description: t('workspace.usefulDescription') }, checklist: { eyebrow: t('workspace.checklistEyebrow'), description: t('workspace.checklistDescription') },
  };

  function selectSection(section: SavedPlanSectionId) {
    setActive(section);
    window.requestAnimationFrame(() => {
      const top = content.current?.getBoundingClientRect().top ?? 0;
      if (top < 12) content.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function renderContent() {
    if (active === 'overview') return <SavedPlanOverview trip={trip} onEdit={onEdit} onTripUpdated={onTripUpdated} />;
    if (active === 'itinerary') return <div className="saved-itinerary">{trip.plan.days.map((day) => <TripDayCard key={day.day} day={day} currency={trip.plan.budget.currency} />)}</div>;
    if (active === 'map') return <SavedPlanMap plan={trip.plan} />;
    if (active === 'weather') return <SavedPlanWeather trip={trip} />;
    if (active === 'budget') return <BudgetBreakdown budget={trip.plan.budget} />;
    if (active === 'accommodations') return <SavedAccommodations plan={trip.plan} />;
    if (active === 'food') return <SavedFood plan={trip.plan} />;
    if (active === 'activities') return <SavedActivities plan={trip.plan} />;
    if (active === 'useful') return <SavedUsefulLinks plan={trip.plan} />;
    return <SavedChecklist plan={trip.plan} />;
  }

  return (
    <div className="saved-workspace">
      <div className="saved-workspace__content" ref={content}>
        {active !== 'overview' && <header className="saved-workspace__heading"><span>{sectionCopy[active].eyebrow}</span><div><h1>{t(currentSection.labelKey)}</h1><p>{sectionCopy[active].description}</p></div></header>}
        <div className="saved-workspace__view" key={active}>{renderContent()}</div>
      </div>
      <SavedPlanSidebar active={active} onSelect={selectSection} />
    </div>
  );
}
