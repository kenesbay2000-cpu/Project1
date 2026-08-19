import { useRef, useState } from 'react';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { BudgetBreakdown } from './BudgetBreakdown';
import { SavedPlanOverview } from './SavedPlanOverview';
import { SavedPlanMap } from './SavedPlanMap';
import { SavedPlanWeather } from './SavedPlanWeather';
import { SavedPlanSidebar, type SavedPlanSectionId, savedPlanSections } from './SavedPlanSidebar';
import { SavedAccommodations, SavedActivities, SavedChecklist, SavedFood, SavedUsefulLinks } from './SavedPlanCollections';
import { TripDayCard } from './TripDayCard';
import './TripPlanResult.css';
import './SavedPlanWorkspace.css';
import './SavedPlanSections.css';

type SavedPlanWorkspaceProps = {
  trip: GeneratedTrip;
  onEdit?: () => void;
  onTripUpdated?: (trip: GeneratedTrip) => void;
};

const sectionCopy: Record<SavedPlanSectionId, { eyebrow: string; description: string }> = {
  overview: { eyebrow: 'Отправная точка', description: '' },
  itinerary: { eyebrow: 'День за днём', description: 'Полное расписание поездки с длительностью активностей, переездами и ориентировочными расходами.' },
  map: { eyebrow: 'География маршрута', description: 'Точки из сохранённого плана на интерактивной карте в порядке посещения.' },
  weather: { eyebrow: 'Условия поездки', description: 'Сезонный контекст и актуальный прогноз, когда даты уже достаточно близко.' },
  budget: { eyebrow: 'Финансовый ориентир', description: 'Разбивка сохранённой оценки расходов с указанием степени точности.' },
  accommodations: { eyebrow: 'Где остановиться', description: 'Подобранные варианты жилья, районы и ориентировочная стоимость ночи.' },
  food: { eyebrow: 'Вкус направления', description: 'Рестораны и гастрономические рекомендации из вашего плана.' },
  activities: { eyebrow: 'Чем заняться', description: 'Общий обзор впечатлений, которые распределены внутри маршрута.' },
  useful: { eyebrow: 'Перед дорогой', description: 'Документы, страховка, деньги и другие важные ориентиры подготовки.' },
  checklist: { eyebrow: 'Ничего не забыть', description: 'Персональный список действий перед этой поездкой.' },
};

export function SavedPlanWorkspace({ trip, onEdit, onTripUpdated }: SavedPlanWorkspaceProps) {
  const [active, setActive] = useState<SavedPlanSectionId>('overview');
  const content = useRef<HTMLDivElement>(null);
  const currentSection = savedPlanSections.find((section) => section.id === active) ?? savedPlanSections[0];

  function selectSection(section: SavedPlanSectionId) {
    setActive(section);
    window.requestAnimationFrame(() => {
      const top = content.current?.getBoundingClientRect().top ?? 0;
      if (top < 12) content.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function renderContent() {
    if (active === 'overview') return <SavedPlanOverview trip={trip} onEdit={onEdit} onTripUpdated={onTripUpdated} />;
    if (active === 'itinerary') return <div className="saved-itinerary">{trip.plan.days.map((day) => <TripDayCard key={day.day} day={day} currency={trip.plan.budget.currency} />)}</div>;
    if (active === 'map') return <SavedPlanMap plan={trip.plan} />;
    if (active === 'weather') return <SavedPlanWeather trip={trip} />;
    if (active === 'budget') return <BudgetBreakdown budget={trip.plan.budget} />;
    if (active === 'accommodations') return <SavedAccommodations plan={trip.plan} />;
    if (active === 'food') return <SavedFood plan={trip.plan} />;
    if (active === 'activities') return <SavedActivities plan={trip.plan} />;
    if (active === 'useful') return <SavedUsefulLinks plan={trip.plan} />;
    return <SavedChecklist plan={trip.plan} />;
  }

  return (
    <div className="saved-workspace">
      <div className="saved-workspace__content" ref={content}>
        {active !== 'overview' && <header className="saved-workspace__heading"><span>{sectionCopy[active].eyebrow}</span><div><h1>{currentSection.label}</h1><p>{sectionCopy[active].description}</p></div></header>}
        <div className="saved-workspace__view" key={active}>{renderContent()}</div>
      </div>
      <SavedPlanSidebar active={active} onSelect={selectSection} />
    </div>
  );
}
