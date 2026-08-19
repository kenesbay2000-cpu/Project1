import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'wouter';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { storePendingTrip } from '../lib/savedPlans';
import './GuestPlanLimitNotice.css';
import { useI18n } from '../i18n/I18nProvider';

type Props = {
  trip: GeneratedTrip | null;
  onClose: () => void;
};

export function GuestPlanLimitNotice({ trip, onClose }: Props) {
  const { t } = useI18n();
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
      setError(t('guest.browserError'));
    }
  }

  return (
    <div className="guest-limit" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="guest-limit__card" role="dialog" aria-modal="true" aria-labelledby="guest-limit-title" aria-describedby="guest-limit-description">
        <button ref={closeButton} className="guest-limit__close" type="button" aria-label={t('guest.close')} onClick={onClose}>×</button>
        <span className="guest-limit__eyebrow">{t('guest.eyebrow')}</span>
        <h2 id="guest-limit-title">{t('guest.title')}</h2>
        <p id="guest-limit-description">{t('guest.text')}</p>
        <div className="guest-limit__actions">
          <Link href="/signup" onClick={preserveTrip}>{t('guest.signup')} <span>→</span></Link>
          <Link href="/login" onClick={preserveTrip}>{t('guest.login')}</Link>
        </div>
        {error && <small role="alert">{error}</small>}
      </section>
    </div>
  );
}
