import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ProtectedPage } from '../components/ProtectedPage';
import { SavedPlanWorkspace } from '../components/SavedPlanWorkspace';
import { useAuth } from '../components/AuthProvider';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { getPlansError, loadSavedPlan } from '../lib/savedPlanQueries';
import { saveTripPlan } from '../lib/savedPlans';
import './ProfilePage.css';
import './SavedPlanPage.css';
import { useI18n } from '../i18n/I18nProvider';

export function SavedPlanPage() {
  const { t } = useI18n();
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
      .then((savedTrip) => { if (isActive) { setTrip(savedTrip); if (!savedTrip) setError(t('savedPlan.notFound')); } })
      .catch((loadError) => { if (isActive) setError(getPlansError('load', loadError, t)); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [user, params?.id, t]);

  return (
    <ProtectedPage label={t('savedPlan.label')} guestDescription={t('savedPlan.guest')}>
      <main className="saved-plan-page">
        <Link className="saved-plan-page__back" href="/my-plans">← {t('savedPlan.back')}</Link>
        {isLoading && <div className="saved-plan-page__state" role="status">{t('savedPlan.loading')}</div>}
        {error && <div className="saved-plan-page__state" role="alert"><p>{error}</p><Link href="/my-plans">{t('savedPlan.return')}</Link></div>}
        {trip && <SavedPlanWorkspace trip={trip} onTripUpdated={(updated) => { setTrip(updated); void saveTripPlan(updated); }} />}
      </main>
    </ProtectedPage>
  );
}
