import { useEffect, useState } from 'react';
import './PlannerGenerationProgress.css';
import { useI18n } from '../i18n/I18nProvider';
import type { GenerationProgress } from '../lib/aiPlanner';

type Props = { progress?: GenerationProgress | null };

export function PlannerGenerationProgress({ progress }: Props) {
  const { t } = useI18n();
  const generationStages = [
    { message: t('generation.step1'), duration: 5_000 }, { message: t('generation.step2'), duration: 6_000 },
    { message: t('generation.step3'), duration: 6_500 }, { message: t('generation.step4'), duration: 7_000 },
    { message: t('generation.step5'), duration: 8_000 }, { message: t('generation.step6'), duration: 0 },
  ];
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (activeStage >= generationStages.length - 1) return undefined;
    const timer = window.setTimeout(
      () => setActiveStage((current) => Math.min(current + 1, generationStages.length - 1)),
      generationStages[activeStage].duration,
    );
    return () => window.clearTimeout(timer);
  }, [activeStage]);

  const actualMessage = progress?.phase === 'days'
    ? t('generation.daysProgress', { start: progress.startDay ?? 1, end: progress.endDay ?? 1 })
    : progress?.phase === 'finalizing' ? t('generation.finalizing') : progress?.mode === 'chunked' ? t('generation.preparingLarge') : null;
  const shownStage = progress?.mode === 'chunked' ? Math.min(progress.completed, progress.total - 1) : activeStage;
  const shownTotal = progress?.mode === 'chunked' ? progress.total : generationStages.length;

  return (
    <section className="planner-generation" role="status" aria-live="polite" aria-atomic="true">
      <div className="planner-generation__orb" aria-hidden="true"><span /><i /><i /><i /></div>
      <div className="planner-generation__copy">
        <small>{t('generation.eyebrow')}</small>
        <strong key={actualMessage ?? activeStage}>{actualMessage ?? generationStages[activeStage].message}</strong>
        <p>{progress?.mode === 'chunked' ? t('generation.largeNote') : t('generation.note')}</p>
      </div>
      <div className="planner-generation__steps" aria-hidden="true">
        {Array.from({ length: shownTotal }, (_, index) => (
          <span className={index < shownStage ? 'is-complete' : index === shownStage ? 'is-active' : ''} key={index} />
        ))}
      </div>
    </section>
  );
}
