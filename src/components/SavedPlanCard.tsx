import { useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { useLocation } from 'wouter';
import type { SavedPlanSummary } from '../lib/savedPlanQueries';
import { useI18n } from '../i18n/I18nProvider';

type SavedPlanCardProps = {
  plan: SavedPlanSummary;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`));
}

export function SavedPlanCard({ plan, onRename, onDelete }: SavedPlanCardProps) {
  const { t, language } = useI18n();
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'rename' | 'delete'>('menu');
  const [title, setTitle] = useState(plan.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dates = plan.startDate && plan.endDate ? `${formatDate(plan.startDate, locale)} — ${formatDate(plan.endDate, locale)}` : t('card.noDates');

  function openPlan() { navigate(`/my-plans/${plan.id}`); }
  function stop(event: MouseEvent) { event.stopPropagation(); }
  function handleKey(event: KeyboardEvent<HTMLElement>) {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) openPlan();
  }

  async function rename(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try { await onRename(plan.id, title); setMenuOpen(false); setMode('menu'); }
    catch (renameError) { setError(renameError instanceof Error ? renameError.message : t('card.renameError')); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError('');
    try { await onDelete(plan.id); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : t('card.deleteError')); setBusy(false); }
  }

  return (
    <article className="saved-plan-card" role="link" tabIndex={0} onClick={openPlan} onKeyDown={handleKey}>
      <div className="saved-plan-card__accent"><span>⌖</span><small>{plan.destination}</small></div>
      <button className="saved-plan-card__menu-button" type="button" aria-label={t('card.actions')} aria-expanded={menuOpen} onClick={(event) => { stop(event); setMenuOpen((open) => !open); setMode('menu'); setError(''); }}>•••</button>
      {menuOpen && <div className="saved-plan-menu" onClick={stop}>
        {mode === 'menu' && <><button type="button" onClick={() => setMode('rename')}>{t('card.rename')}</button><button className="saved-plan-menu__delete" type="button" onClick={() => setMode('delete')}>{t('card.delete')}</button></>}
        {mode === 'rename' && <form onSubmit={rename}><label>{t('card.newTitle')}<input autoFocus maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} /></label><div><button type="button" onClick={() => setMode('menu')}>{t('card.cancel')}</button><button type="submit" disabled={busy}>{t('card.save')}</button></div></form>}
        {mode === 'delete' && <div className="saved-plan-menu__confirm"><strong>{t('card.deleteTitle')}</strong><p>{t('card.deleteWarning')}</p><div><button type="button" onClick={() => setMode('menu')}>{t('card.cancel')}</button><button type="button" disabled={busy} onClick={() => void remove()}>{busy ? t('card.deleting') : t('card.delete')}</button></div></div>}
        {error && <p className="saved-plan-menu__error" role="alert">{error}</p>}
      </div>}
      <div className="saved-plan-card__body"><span>{dates}</span><h2>{plan.title}</h2><p>{t('card.days', { count: plan.days })} · {plan.budget === null ? t('card.noBudget') : `${plan.budget.toLocaleString(locale)} ${plan.currency}`}</p></div>
      <span className="saved-plan-card__open">{t('card.open')}</span>
    </article>
  );
}
