import { useState } from 'react';
import { PlannerForm } from '../components/PlannerForm';
import { GuestPlanLimitNotice } from '../components/GuestPlanLimitNotice';
import { TripPlanResult } from '../components/TripPlanResult';
import { useAuth } from '../components/AuthProvider';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { hasGuestCompletedPlan, recordGuestCompletedPlan } from '../lib/guestPlannerLimit';
import { clearPendingTrip, getPendingTrip } from '../lib/savedPlans';
import './PlannerPage.css';

export function PlannerPage() {
  const { user, isLoading } = useAuth();
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
    <main className={`planner-page${trip ? ' planner-page--result' : ''}`}>
      <div hidden={Boolean(trip)}>
        <section className="planner-page__intro">
          <span className="planner-page__eyebrow">Умное путешествие</span>
          <h1>AI Planner</h1>
          <p>Опишите желаемую поездку, а Gemini соберёт персональный маршрут с учётом ваших уточнений.</p>
        </section>
        {!isLoading && <PlannerForm onPlanCreated={handlePlanCreated} onBeforeGenerate={canGenerateNewPlan} />}
        {isLoading && <p className="planner-page__access-loading" role="status">Проверяем сессию…</p>}
      </div>
      {trip && <TripPlanResult trip={trip} onEdit={editTrip} onTripUpdated={setTrip} />}
      {showGuestLimit && !user && <GuestPlanLimitNotice trip={trip} onClose={() => setShowGuestLimit(false)} />}
    </main>
  );
}
