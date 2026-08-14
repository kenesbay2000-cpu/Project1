import { useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { useLocation } from 'wouter';
import type { SavedPlanSummary } from '../lib/savedPlanQueries';

type SavedPlanCardProps = {
  plan: SavedPlanSummary;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`));
}

export function SavedPlanCard({ plan, onRename, onDelete }: SavedPlanCardProps) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'rename' | 'delete'>('menu');
  const [title, setTitle] = useState(plan.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dates = plan.startDate && plan.endDate ? `${formatDate(plan.startDate)} — ${formatDate(plan.endDate)}` : 'Даты не указаны';

  function openPlan() { navigate(`/my-plans/${plan.id}`); }
  function stop(event: MouseEvent) { event.stopPropagation(); }
  function handleKey(event: KeyboardEvent<HTMLElement>) {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) openPlan();
  }

  async function rename(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try { await onRename(plan.id, title); setMenuOpen(false); setMode('menu'); }
    catch (renameError) { setError(renameError instanceof Error ? renameError.message : 'Не удалось переименовать поездку.'); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError('');
    try { await onDelete(plan.id); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Не удалось удалить поездку.'); setBusy(false); }
  }

  return (
    <article className="saved-plan-card" role="link" tabIndex={0} onClick={openPlan} onKeyDown={handleKey}>
      <div className="saved-plan-card__accent"><span>⌖</span><small>{plan.destination}</small></div>
      <button className="saved-plan-card__menu-button" type="button" aria-label="Действия с поездкой" aria-expanded={menuOpen} onClick={(event) => { stop(event); setMenuOpen((open) => !open); setMode('menu'); setError(''); }}>•••</button>
      {menuOpen && <div className="saved-plan-menu" onClick={stop}>
        {mode === 'menu' && <><button type="button" onClick={() => setMode('rename')}>Переименовать</button><button className="saved-plan-menu__delete" type="button" onClick={() => setMode('delete')}>Удалить</button></>}
        {mode === 'rename' && <form onSubmit={rename}><label>Новое название<input autoFocus maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} /></label><div><button type="button" onClick={() => setMode('menu')}>Отмена</button><button type="submit" disabled={busy}>Сохранить</button></div></form>}
        {mode === 'delete' && <div className="saved-plan-menu__confirm"><strong>Удалить поездку?</strong><p>Это действие нельзя отменить.</p><div><button type="button" onClick={() => setMode('menu')}>Отмена</button><button type="button" disabled={busy} onClick={() => void remove()}>{busy ? 'Удаляем…' : 'Удалить'}</button></div></div>}
        {error && <p className="saved-plan-menu__error" role="alert">{error}</p>}
      </div>}
      <div className="saved-plan-card__body"><span>{dates}</span><h2>{plan.title}</h2><p>{plan.days} дн. · {plan.budget === null ? 'Бюджет не указан' : `${plan.budget.toLocaleString('ru-RU')} ${plan.currency}`}</p></div>
      <span className="saved-plan-card__open">Открыть маршрут →</span>
    </article>
  );
}
