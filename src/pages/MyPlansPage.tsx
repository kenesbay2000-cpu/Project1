import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ProtectedPage } from '../components/ProtectedPage';
import { SavedPlanCard } from '../components/SavedPlanCard';
import { useAuth } from '../components/AuthProvider';
import { deleteSavedPlan, getPlansError, loadSavedPlans, renameSavedPlan, type SavedPlanSummary } from '../lib/savedPlanQueries';
import './ProfilePage.css';
import './MyPlansPage.css';

export function MyPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SavedPlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let isActive = true;
    setIsLoading(true); setError('');
    void loadSavedPlans()
      .then((items) => { if (isActive) setPlans(items); })
      .catch((loadError) => { if (isActive) setError(getPlansError('load', loadError)); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [user, reloadKey]);

  async function rename(id: string, title: string) {
    try {
      await renameSavedPlan(id, title);
      setPlans((items) => items.map((plan) => plan.id === id ? { ...plan, title: title.trim() } : plan));
    } catch (renameError) { throw new Error(getPlansError('rename', renameError)); }
  }

  async function remove(id: string) {
    try { await deleteSavedPlan(id); setPlans((items) => items.filter((plan) => plan.id !== id)); }
    catch (deleteError) { throw new Error(getPlansError('delete', deleteError)); }
  }

  return (
    <ProtectedPage label="Мои планы" guestDescription="Сохранённые поездки доступны после авторизации.">
      <main className="my-plans-page">
        <header><span>Личная коллекция</span><h1>Мои планы</h1><p>Сохранённые маршруты всегда под рукой — открывайте детали или наводите порядок в коллекции.</p></header>
        {isLoading && <div className="my-plans-loading" role="status"><span />Загружаем поездки…</div>}
        {error && <div className="my-plans-error" role="alert"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)}>Попробовать снова</button></div>}
        {!isLoading && !error && plans.length > 0 && <section className="saved-plans-grid" aria-label="Сохранённые поездки">{plans.map((plan) => <SavedPlanCard key={plan.id} plan={plan} onRename={rename} onDelete={remove} />)}</section>}
        {!isLoading && !error && plans.length === 0 && <section className="my-plans-empty"><div aria-hidden="true">⌖</div><span>Путешествие начинается с идеи</span><h2>Пока нет сохранённых поездок</h2><p>Создайте персональный маршрут в AI Planner и сохраните его в аккаунте.</p><Link href="/planner">Создать первый маршрут <span>→</span></Link></section>}
      </main>
    </ProtectedPage>
  );
}
