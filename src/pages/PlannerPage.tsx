import { useState } from 'react';
import { PlannerForm } from '../components/PlannerForm';
import { GuestPlanLimitNotice } from '../components/GuestPlanLimitNotice';
import { SavedPlanWorkspace } from '../components/SavedPlanWorkspace';
import { useAuth } from '../components/AuthProvider';
import type { GeneratedTrip } from '../lib/aiPlanner';
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
      data-header-theme="light"
    >
      <div hidden={Boolean(trip)}>
        {!isLoading && <PlannerForm onPlanCreated={handlePlanCreated} onBeforeGenerate={canGenerateNewPlan} />}
        {isLoading && <p className="planner-page__access-loading" role="status">{t('planner.sessionLoading')}</p>}
      </div>
      {trip && <SavedPlanWorkspace trip={trip} onEdit={editTrip} onTripUpdated={setTrip} />}
      {showGuestLimit && !user && <GuestPlanLimitNotice trip={trip} onClose={() => setShowGuestLimit(false)} />}
    </main>
  );
}
