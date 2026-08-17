import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ProtectedPage } from '../components/ProtectedPage';
import { TripPlanResult } from '../components/TripPlanResult';
import { useAuth } from '../components/AuthProvider';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { getPlansError, loadSavedPlan } from '../lib/savedPlanQueries';
import './ProfilePage.css';
import './SavedPlanPage.css';

export function SavedPlanPage() {
  const [, params] = useRoute('/my-plans/:id');
  const { user } = useAuth();
  const [trip, setTrip] = useState<GeneratedTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !params?.id) return;
    let isActive = true;
    setIsLoading(true); setError('');
    void loadSavedPlan(params.id, user.id)
      .then((savedTrip) => { if (isActive) { setTrip(savedTrip); if (!savedTrip) setError('Этот план не найден или у вас нет к нему доступа.'); } })
      .catch((loadError) => { if (isActive) setError(getPlansError('load', loadError)); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [user, params?.id]);

  return (
    <ProtectedPage label="Сохранённый план" guestDescription="Войдите, чтобы открыть сохранённый маршрут.">
      <main className="saved-plan-page">
        <Link className="saved-plan-page__back" href="/my-plans">← Ко всем планам</Link>
        {isLoading && <div className="saved-plan-page__state" role="status">Загружаем маршрут…</div>}
        {error && <div className="saved-plan-page__state" role="alert"><p>{error}</p><Link href="/my-plans">Вернуться к списку</Link></div>}
        {trip && <TripPlanResult trip={trip} heroEyebrow="Сохранённое путешествие" />}
      </main>
    </ProtectedPage>
  );
}
