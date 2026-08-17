import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'wouter';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { clearPendingTrip, getPendingTrip, getSavePlanError, saveTripPlan, storePendingTrip } from '../lib/savedPlans';
import { useAuth } from './AuthProvider';
import './SavePlanButton.css';

type SavePlanButtonProps = {
  trip: GeneratedTrip;
};

export function SavePlanButton({ trip }: SavePlanButtonProps) {
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
      setError(getSavePlanError(saveError));
    }
  }

  useEffect(() => {
    const pending = getPendingTrip();
    if (!user || autoSaveStarted.current || pending?.id !== trip.id) return;
    autoSaveStarted.current = true;
    void save();
  }, [user, trip.id]);

  function prepareAuth(event: MouseEvent<HTMLAnchorElement>) {
    try { storePendingTrip(trip); }
    catch {
      event.preventDefault();
      setError('Не удалось временно сохранить маршрут в браузере. Освободите место и попробуйте снова.');
    }
  }

  if (status === 'saved') return <div className="save-plan save-plan--success" role="status"><span>✓</span><div><strong>План сохранён</strong><p>Маршрут надёжно привязан к вашему аккаунту.</p><Link href="/my-plans">Открыть «Мои планы» →</Link></div></div>;

  return (
    <section className="save-plan">
      <div><span>Сохранить путешествие</span><h2>Вернитесь к маршруту в любое время</h2><p>План будет привязан к вашему аккаунту.</p></div>
      <button type="button" disabled={isLoading || status === 'saving'} onClick={() => user ? void save() : setShowAuth(true)}>
        {status === 'saving' ? 'Сохраняем…' : 'Сохранить план'}
      </button>
      {showAuth && !user && <div className="save-plan__auth"><p>Войдите или создайте аккаунт — маршрут сохранится автоматически после авторизации.</p><Link href="/login" onClick={prepareAuth}>Войти</Link><Link href="/signup" onClick={prepareAuth}>Регистрация</Link></div>}
      {error && <p className="save-plan__error" role="alert">{error}</p>}
    </section>
  );
}
