import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ProtectedPage } from '../components/ProtectedPage';
import { SavedPlanCard } from '../components/SavedPlanCard';
import { useAuth } from '../components/AuthProvider';
import { deleteSavedPlan, getPlansError, loadSavedPlans, renameSavedPlan, type SavedPlanSummary } from '../lib/savedPlanQueries';
import './ProfilePage.css';
import './MyPlansPage.css';
import { useI18n } from '../i18n/I18nProvider';

export function MyPlansPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SavedPlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let isActive = true;
    setIsLoading(true); setError('');
    void loadSavedPlans(user.id)
      .then((items) => { if (isActive) setPlans(items); })
      .catch((loadError) => { if (isActive) setError(getPlansError('load', loadError, t)); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [user, reloadKey, t]);

  async function rename(id: string, title: string) {
    if (!user) throw new Error(t('plans.sessionExpired'));
    try {
      await renameSavedPlan(id, user.id, title);
      setPlans((items) => items.map((plan) => plan.id === id ? { ...plan, title: title.trim() } : plan));
    } catch (renameError) { throw new Error(getPlansError('rename', renameError, t)); }
  }

  async function remove(id: string) {
    if (!user) throw new Error(t('plans.sessionExpired'));
    try { await deleteSavedPlan(id, user.id); setPlans((items) => items.filter((plan) => plan.id !== id)); }
    catch (deleteError) { throw new Error(getPlansError('delete', deleteError, t)); }
  }

  return (
    <ProtectedPage label={t('plans.label')} guestDescription={t('plans.guest')}>
      <main className="my-plans-page">
        <header><span>{t('plans.eyebrow')}</span><h1>{t('plans.title')}</h1><p>{t('plans.intro')}</p></header>
        {isLoading && <div className="my-plans-loading" role="status"><span />{t('plans.loading')}</div>}
        {error && <div className="my-plans-error" role="alert"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)}>{t('plans.retry')}</button></div>}
        {!isLoading && !error && plans.length > 0 && <section className="saved-plans-grid" aria-label={t('plans.savedAria')}>{plans.map((plan) => <SavedPlanCard key={plan.id} plan={plan} onRename={rename} onDelete={remove} />)}</section>}
        {!isLoading && !error && plans.length === 0 && <section className="my-plans-empty"><div aria-hidden="true">⌖</div><span>{t('plans.emptyEyebrow')}</span><h2>{t('plans.emptyTitle')}</h2><p>{t('plans.emptyText')}</p><Link href="/planner">{t('plans.createFirst')} <span>→</span></Link></section>}
      </main>
    </ProtectedPage>
  );
}
