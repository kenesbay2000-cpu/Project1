import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { InspirationGroup } from '../lib/inspirationGroups';
import { DeferredHeroShowcase } from './DeferredHeroShowcase';

type Props = {
  groups: InspirationGroup[];
  id: string;
  eyebrow: string;
  title: string;
  initialCount?: number;
  showPlannerOnFirst?: boolean;
};

export function InspirationCarouselLayer({ groups, id, eyebrow, title, initialCount = 3, showPlannerOnFirst = false }: Props) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleGroups = isExpanded ? groups : groups.slice(0, initialCount);
  const hasHiddenGroups = groups.length > initialCount;

  return (
    <section className="inspiration-layer" aria-labelledby={`${id}-title`}>
      <header className="inspiration-layer__heading">
        <span>{eyebrow}</span>
        <h3 id={`${id}-title`}>{title}</h3>
      </header>

      <div className="inspiration-layer__carousels">
        {visibleGroups.map((group, index) => {
          const headingId = `${id}-${group.id}`;
          return (
            <section className="themed-carousel" aria-labelledby={headingId} key={group.id}>
              <header className="themed-carousel__heading">
                <span>{t('home.themeCollection')} · {String(group.destinations.length).padStart(2, '0')}</span>
                <h4 id={headingId}>{t(group.titleKey)}</h4>
              </header>
              <DeferredHeroShowcase destinations={group.destinations} showPlanner={showPlannerOnFirst && index === 0} />
            </section>
          );
        })}
      </div>

      {hasHiddenGroups && (
        <button className="inspiration-layer__toggle" type="button" aria-expanded={isExpanded} onClick={() => setIsExpanded((value) => !value)}>
          {t(isExpanded ? 'home.showFewerCategories' : 'home.showMoreCategories')}
          <span aria-hidden="true">{isExpanded ? '↑' : '↓'}</span>
        </button>
      )}
    </section>
  );
}
