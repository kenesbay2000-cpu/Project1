import { type CSSProperties, useState } from 'react';
import { PlannerForm } from '../components/PlannerForm';
import { GuestPlanLimitNotice } from '../components/GuestPlanLimitNotice';
import { SavedPlanWorkspace } from '../components/SavedPlanWorkspace';
import { useAuth } from '../components/AuthProvider';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { destinations } from '../lib/destinations';
import { hasGuestCompletedPlan, recordGuestCompletedPlan } from '../lib/guestPlannerLimit';
import { clearPendingTrip, getPendingTrip } from '../lib/savedPlans';
import { useI18n } from '../i18n/I18nProvider';
import './PlannerPage.css';

export function PlannerPage() {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const [trip, setTrip] = useState<GeneratedTrip | null>(() => getPendingTrip());
  const [showGuestLimit, setShowGuestLimit] = useState(false);

  function editTrip() {
    if (!user && hasGuestCompletedPlan()) {
      setShowGuestLimit(true);
      return;
    }
    if (getPendingTrip()?.id === trip?.id) clearPendingTrip();
    setTrip(null);
  }

  function canGenerateNewPlan() {
    if (user || !hasGuestCompletedPlan()) return true;
    setShowGuestLimit(true);
    return false;
  }

  function handlePlanCreated(generatedTrip: GeneratedTrip) {
    if (!user) recordGuestCompletedPlan();
    setTrip(generatedTrip);
  }

  return (
    <main
      className={`planner-page${trip ? ' planner-page--result' : ''}`}
      data-header-overlay={trip ? undefined : ''}
      data-header-theme={trip ? 'light' : 'dark'}
      style={{ '--planner-backdrop': `url(${destinations.find((item) => item.slug === 'bali')?.image})` } as CSSProperties}
    >
      <div hidden={Boolean(trip)}>
        <section className="planner-page__intro">
          <span className="planner-page__eyebrow"><i /> {t('planner.eyebrow')}</span>
          <h1>{t('planner.title')}<em>{t('planner.titleAccent')}</em></h1>
          <p>{t('planner.intro')}</p>
        </section>
        {!isLoading && <PlannerForm onPlanCreated={handlePlanCreated} onBeforeGenerate={canGenerateNewPlan} />}
        {isLoading && <p className="planner-page__access-loading" role="status">{t('planner.sessionLoading')}</p>}
      </div>
      {trip && <SavedPlanWorkspace trip={trip} onEdit={editTrip} onTripUpdated={setTrip} />}
      {showGuestLimit && !user && <GuestPlanLimitNotice trip={trip} onClose={() => setShowGuestLimit(false)} />}
    </main>
  );
}
