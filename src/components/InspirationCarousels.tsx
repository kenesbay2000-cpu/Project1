import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { getDestinations } from '../lib/content';
import { destinations as canonicalDestinations } from '../lib/destinations';
import { createRegionGroups, createThemeGroups } from '../lib/inspirationGroups';
import { InspirationCarouselLayer } from './InspirationCarouselLayer';

export function InspirationCarousels() {
  const { language, t } = useI18n();
  const { themeGroups, regionGroups } = useMemo(() => {
    const localizedDestinations = getDestinations(language);
    return {
      themeGroups: createThemeGroups(localizedDestinations),
      regionGroups: createRegionGroups(localizedDestinations, canonicalDestinations),
    };
  }, [language]);

  return (
    <div className="inspiration-carousels">
      <InspirationCarouselLayer
        id="inspiration-by-type"
        eyebrow={t('home.byTypeEyebrow')}
        title={t('home.byTypeTitle')}
        groups={themeGroups}
        showPlannerOnFirst
      />
      <InspirationCarouselLayer
        id="inspiration-by-region"
        eyebrow={t('home.byRegionEyebrow')}
        title={t('home.byRegionTitle')}
        groups={regionGroups}
      />
    </div>
  );
}
