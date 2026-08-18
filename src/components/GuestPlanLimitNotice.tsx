import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'wouter';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { storePendingTrip } from '../lib/savedPlans';
import './GuestPlanLimitNotice.css';

type Props = {
  trip: GeneratedTrip | null;
  onClose: () => void;
};

export function GuestPlanLimitNotice({ trip, onClose }: Props) {
  const [error, setError] = useState('');
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  function preserveTrip(event: MouseEvent<HTMLAnchorElement>) {
    if (!trip) return;
    try {
      storePendingTrip(trip);
    } catch {
      event.preventDefault();
      setError('Не удалось временно сохранить маршрут. Освободите место в браузере и попробуйте снова.');
    }
  }

  return (
    <div className="guest-limit" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="guest-limit__card" role="dialog" aria-modal="true" aria-labelledby="guest-limit-title" aria-describedby="guest-limit-description">
        <button ref={closeButton} className="guest-limit__close" type="button" aria-label="Закрыть" onClick={onClose}>×</button>
        <span className="guest-limit__eyebrow">Ваш первый маршрут готов</span>
        <h2 id="guest-limit-title">Сохрани эту поездку и продолжи планировать новые</h2>
        <p id="guest-limit-description">Зарегистрируйтесь бесплатно, чтобы создавать новые маршруты и возвращаться к своим планам в любое время.</p>
        <div className="guest-limit__actions">
          <Link href="/signup" onClick={preserveTrip}>Зарегистрироваться бесплатно <span>→</span></Link>
          <Link href="/login" onClick={preserveTrip}>Уже есть аккаунт</Link>
        </div>
        {error && <small role="alert">{error}</small>}
      </section>
    </div>
  );
}
