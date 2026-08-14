import { useState } from 'react';
import { PlannerForm } from '../components/PlannerForm';
import { TripPlanResult } from '../components/TripPlanResult';
import type { TripPlan } from '../lib/aiPlanner';
import './PlannerPage.css';

export function PlannerPage() {
  const [plan, setPlan] = useState<TripPlan | null>(null);

  return (
    <main className={`planner-page${plan ? ' planner-page--result' : ''}`}>
      <div hidden={Boolean(plan)}>
        <section className="planner-page__intro">
          <span className="planner-page__eyebrow">Умное путешествие</span>
          <h1>AI Planner</h1>
          <p>Опишите желаемую поездку, а Gemini соберёт персональный маршрут с учётом ваших уточнений.</p>
        </section>
        <PlannerForm onPlanCreated={setPlan} />
      </div>
      {plan && <TripPlanResult plan={plan} onEdit={() => setPlan(null)} />}
    </main>
  );
}
