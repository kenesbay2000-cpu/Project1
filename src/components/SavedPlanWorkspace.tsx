import { useEffect, useRef, useState } from 'react';
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
import { PlanExportControls } from './PlanExportControls';
import { PrintableTripPlan } from './PrintableTripPlan';
import { DeferredPlanSection } from './DeferredPlanSection';
import { generateDeferredTripSection } from '../lib/largeTripGeneration';
import type { DeferredPlanSection as DeferredSectionId } from '../lib/aiPlannerTypes';
import './PlanExport.css';

type SavedPlanWorkspaceProps = {
  trip: GeneratedTrip;
  onEdit?: () => void;
  onTripUpdated?: (trip: GeneratedTrip) => void;
};

export function SavedPlanWorkspace({ trip, onEdit, onTripUpdated }: SavedPlanWorkspaceProps) {
  const { t } = useI18n();
  const [active, setActive] = useState<SavedPlanSectionId>('overview');
  const [loadingSection, setLoadingSection] = useState<DeferredSectionId | null>(null);
  const [failedSection, setFailedSection] = useState<DeferredSectionId | null>(null);
  const [generationError, setGenerationError] = useState('');
  const content = useRef<HTMLDivElement>(null);
  const currentSection = savedPlanSections.find((section) => section.id === active) ?? savedPlanSections[0];
  const sectionCopy: Record<SavedPlanSectionId, { eyebrow: ReturnType<typeof t>; description: ReturnType<typeof t> | '' }> = {
    overview: { eyebrow: t('workspace.overviewEyebrow'), description: '' }, itinerary: { eyebrow: t('workspace.itineraryEyebrow'), description: t('workspace.itineraryDescription') },
    map: { eyebrow: t('workspace.mapEyebrow'), description: t('workspace.mapDescription') }, weather: { eyebrow: t('workspace.weatherEyebrow'), description: t('workspace.weatherDescription') },
    budget: { eyebrow: t('workspace.budgetEyebrow'), description: t('workspace.budgetDescription') }, accommodations: { eyebrow: t('workspace.staysEyebrow'), description: t('workspace.staysDescription') },
    food: { eyebrow: t('workspace.foodEyebrow'), description: t('workspace.foodDescription') }, activities: { eyebrow: t('workspace.activitiesEyebrow'), description: t('workspace.activitiesDescription') },
    useful: { eyebrow: t('workspace.usefulEyebrow'), description: t('workspace.usefulDescription') }, checklist: { eyebrow: t('workspace.checklistEyebrow'), description: t('workspace.checklistDescription') },
  };

  function deferredSection(section: SavedPlanSectionId): DeferredSectionId | null {
    if (section === 'itinerary' || section === 'map') return 'itinerary';
    if (section === 'accommodations' || section === 'food' || section === 'activities' || section === 'checklist') return section;
    return section === 'useful' ? 'usefulLinks' : null;
  }

  async function loadSection(section: DeferredSectionId) {
    if (loadingSection || !(trip.request.deferredSections ?? []).includes(section) || !onTripUpdated) return;
    setLoadingSection(section); setFailedSection(null); setGenerationError('');
    try { onTripUpdated(await generateDeferredTripSection(trip, section)); }
    catch (error) { setFailedSection(section); setGenerationError(error instanceof Error ? error.message : t('workspace.lazyError')); }
    finally { setLoadingSection(null); }
  }

  useEffect(() => {
    const deferred = deferredSection(active);
    if (deferred && failedSection !== deferred && !loadingSection
      && (trip.request.deferredSections ?? []).includes(deferred)) void loadSection(deferred);
  }, [active, failedSection, loadingSection, trip.request.deferredSections]);

  function selectSection(section: SavedPlanSectionId) {
    setActive(section);
    window.requestAnimationFrame(() => {
      const top = content.current?.getBoundingClientRect().top ?? 0;
      if (top < 12) content.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function renderContent() {
    const deferred = deferredSection(active);
    if (deferred && (loadingSection === deferred || failedSection === deferred)) {
      return <DeferredPlanSection isLoading={loadingSection === deferred} error={generationError} onRetry={() => void loadSection(deferred)} />;
    }
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
      {!(trip.request.deferredSections?.length) && <PlanExportControls trip={trip} />}
      <div className="saved-workspace__content" ref={content}>
        {active !== 'overview' && <header className="saved-workspace__heading"><span>{sectionCopy[active].eyebrow}</span><div><h1>{t(currentSection.labelKey)}</h1><p>{sectionCopy[active].description}</p></div></header>}
        <div className="saved-workspace__view" key={active}>{renderContent()}</div>
      </div>
      <SavedPlanSidebar active={active} onSelect={selectSection} />
      {!(trip.request.deferredSections?.length) && <PrintableTripPlan trip={trip} />}
    </div>
  );
}
