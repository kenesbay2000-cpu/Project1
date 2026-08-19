import { useRef, type KeyboardEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider';

export const savedPlanSections = [
  { id: 'overview', icon: '◫', labelKey: 'workspace.overview' }, { id: 'itinerary', icon: '≋', labelKey: 'workspace.itinerary' },
  { id: 'map', icon: '⌖', labelKey: 'workspace.map' }, { id: 'weather', icon: '☼', labelKey: 'workspace.weather' },
  { id: 'budget', icon: '◉', labelKey: 'workspace.budget' }, { id: 'accommodations', icon: '⌂', labelKey: 'workspace.stays' },
  { id: 'food', icon: '◌', labelKey: 'workspace.food' }, { id: 'activities', icon: '◇', labelKey: 'workspace.activities' },
  { id: 'useful', icon: 'i', labelKey: 'workspace.useful' }, { id: 'checklist', icon: '✓', labelKey: 'workspace.checklist' },
] as const;

export type SavedPlanSectionId = typeof savedPlanSections[number]['id'];

type Props = {
  active: SavedPlanSectionId;
  onSelect: (section: SavedPlanSectionId) => void;
};

export function SavedPlanSidebar({ active, onSelect }: Props) {
  const { t } = useI18n();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % savedPlanSections.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + savedPlanSections.length) % savedPlanSections.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = savedPlanSections.length - 1;
    else return;
    event.preventDefault();
    const section = savedPlanSections[next];
    buttons.current[next]?.focus();
    onSelect(section.id);
  }

  return (
    <aside className="saved-workspace__sidebar">
      <div className="saved-workspace__sidebar-title"><span>{t('workspace.sections')}</span><strong>Workspace</strong></div>
      <nav aria-label={t('workspace.sectionsAria')}>
        {savedPlanSections.map((section, index) => (
          <button
            ref={(element) => { buttons.current[index] = element; }}
            className={active === section.id ? 'is-active' : ''}
            type="button"
            key={section.id}
            aria-current={active === section.id ? 'page' : undefined}
            onClick={() => onSelect(section.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span aria-hidden="true">{section.icon}</span>{t(section.labelKey)}
          </button>
        ))}
      </nav>
    </aside>
  );
}
