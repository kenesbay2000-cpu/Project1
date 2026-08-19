import { useEffect, useState } from 'react';
import './PlannerGenerationProgress.css';
import { useI18n } from '../i18n/I18nProvider';

export function PlannerGenerationProgress() {
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

  return (
    <section className="planner-generation" role="status" aria-live="polite" aria-atomic="true">
      <div className="planner-generation__orb" aria-hidden="true"><span /><i /><i /><i /></div>
      <div className="planner-generation__copy">
        <small>{t('generation.eyebrow')}</small>
        <strong key={activeStage}>{generationStages[activeStage].message}</strong>
        <p>{t('generation.note')}</p>
      </div>
      <div className="planner-generation__steps" aria-hidden="true">
        {generationStages.map((stage, index) => (
          <span className={index < activeStage ? 'is-complete' : index === activeStage ? 'is-active' : ''} key={stage.message} />
        ))}
      </div>
    </section>
  );
}
