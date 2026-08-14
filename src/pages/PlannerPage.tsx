import { useState } from 'react';
import { PlannerForm } from '../components/PlannerForm';
import { TripPlanResult } from '../components/TripPlanResult';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { clearPendingTrip, getPendingTrip } from '../lib/savedPlans';
import './PlannerPage.css';

export function PlannerPage() {
  const [trip, setTrip] = useState<GeneratedTrip | null>(() => getPendingTrip());

  function editTrip() {
    if (getPendingTrip()?.id === trip?.id) clearPendingTrip();
    setTrip(null);
  }

  return (
    <main className={`planner-page${trip ? ' planner-page--result' : ''}`}>
      <div hidden={Boolean(trip)}>
        <section className="planner-page__intro">
          <span className="planner-page__eyebrow">Умное путешествие</span>
          <h1>AI Planner</h1>
          <p>Опишите желаемую поездку, а Gemini соберёт персональный маршрут с учётом ваших уточнений.</p>
        </section>
        <PlannerForm onPlanCreated={setTrip} />
      </div>
      {trip && <TripPlanResult trip={trip} onEdit={editTrip} />}
    </main>
  );
}
