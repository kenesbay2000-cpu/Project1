import { useEffect, useState } from 'react';
import './PlannerGenerationProgress.css';

const generationStages = [
  { message: 'Анализируем детали поездки…', duration: 5_000 },
  { message: 'Выстраиваем маршрут по дням…', duration: 6_000 },
  { message: 'Проверяем логистику и темп…', duration: 6_500 },
  { message: 'Считаем ориентировочный бюджет…', duration: 7_000 },
  { message: 'Подбираем жильё, еду и активности…', duration: 8_000 },
  { message: 'Собираем финальный план…', duration: 0 },
];

export function PlannerGenerationProgress() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (activeStage >= generationStages.length - 1) return undefined;
    const timer = window.setTimeout(
      () => setActiveStage((current) => Math.min(current + 1, generationStages.length - 1)),
      generationStages[activeStage].duration,
    );
    return () => window.clearTimeout(timer);
  }, [activeStage]);

  return (
    <section className="planner-generation" role="status" aria-live="polite" aria-atomic="true">
      <div className="planner-generation__orb" aria-hidden="true"><span /><i /><i /><i /></div>
      <div className="planner-generation__copy">
        <small>AI создаёт ваше путешествие</small>
        <strong key={activeStage}>{generationStages[activeStage].message}</strong>
        <p>Большой персональный план требует немного времени. Можно оставаться на этой странице.</p>
      </div>
      <div className="planner-generation__steps" aria-hidden="true">
        {generationStages.map((stage, index) => (
          <span className={index < activeStage ? 'is-complete' : index === activeStage ? 'is-active' : ''} key={stage.message} />
        ))}
      </div>
    </section>
  );
}
