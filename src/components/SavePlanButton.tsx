import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'wouter';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { clearPendingTrip, getPendingTrip, getSavePlanError, saveTripPlan, storePendingTrip } from '../lib/savedPlans';
import { useAuth } from './AuthProvider';
import './SavePlanButton.css';
import { useI18n } from '../i18n/I18nProvider';

type SavePlanButtonProps = {
  trip: GeneratedTrip;
};

export function SavePlanButton({ trip }: SavePlanButtonProps) {
  const { t } = useI18n();
  const { user, isLoading } = useAuth();
  const autoSaveStarted = useRef(false);
  const [showAuth, setShowAuth] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState('');

  async function save() {
    if (!user) return;
    setStatus('saving');
    setError('');
    try {
      await saveTripPlan(trip);
      clearPendingTrip();
      setStatus('saved');
    } catch (saveError) {
      setStatus('idle');
      setError(getSavePlanError(saveError, t));
    }
  }

  useEffect(() => {
    const pending = getPendingTrip();
    if (!user || autoSaveStarted.current || pending?.id !== trip.id) return;
    autoSaveStarted.current = true;
    void save();
  }, [user, trip.id]);

  useEffect(() => {
    if (!user || status !== 'saved') return;
    void saveTripPlan(trip).catch((saveError) => setError(getSavePlanError(saveError, t)));
  }, [user, status, trip.request.deferredSections?.length]);

  function prepareAuth(event: MouseEvent<HTMLAnchorElement>) {
    try { storePendingTrip(trip); }
    catch {
      event.preventDefault();
      setError(t('save.browserError'));
    }
  }

  if (status === 'saved') return <div className="save-plan save-plan--success" role="status"><span>✓</span><div><strong>{t('save.saved')}</strong><p>{t('save.savedText')}</p><Link href="/my-plans">{t('save.openPlans')}</Link></div></div>;

  return (
    <section className="save-plan">
      <div><span>{t('save.eyebrow')}</span><h2>{t('save.title')}</h2><p>{t('save.text')}</p></div>
      <button type="button" disabled={isLoading || status === 'saving'} onClick={() => user ? void save() : setShowAuth(true)}>
        {status === 'saving' ? t('save.saving') : t('save.button')}
      </button>
      {showAuth && !user && <div className="save-plan__auth"><p>{t('save.authText')}</p><Link href="/login" onClick={prepareAuth}>{t('save.login')}</Link><Link href="/signup" onClick={prepareAuth}>{t('save.signup')}</Link></div>}
      {error && <p className="save-plan__error" role="alert">{error}</p>}
    </section>
  );
}
