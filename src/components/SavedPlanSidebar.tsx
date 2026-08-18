import { useRef, type KeyboardEvent } from 'react';

export const savedPlanSections = [
  { id: 'overview', icon: '◫', label: 'Обзор' },
  { id: 'itinerary', icon: '≋', label: 'Маршрут по дням' },
  { id: 'map', icon: '⌖', label: 'Карта' },
  { id: 'weather', icon: '☼', label: 'Погода' },
  { id: 'budget', icon: '◉', label: 'Бюджет' },
  { id: 'accommodations', icon: '⌂', label: 'Жильё' },
  { id: 'food', icon: '◌', label: 'Еда' },
  { id: 'activities', icon: '◇', label: 'Активности' },
  { id: 'useful', icon: 'i', label: 'Полезные ссылки' },
  { id: 'checklist', icon: '✓', label: 'Подготовка' },
] as const;

export type SavedPlanSectionId = typeof savedPlanSections[number]['id'];

type Props = {
  active: SavedPlanSectionId;
  onSelect: (section: SavedPlanSectionId) => void;
};

export function SavedPlanSidebar({ active, onSelect }: Props) {
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
      <div className="saved-workspace__sidebar-title"><span>Разделы поездки</span><strong>Workspace</strong></div>
      <nav aria-label="Разделы сохранённого плана">
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
            <span aria-hidden="true">{section.icon}</span>{section.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
