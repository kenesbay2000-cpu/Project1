import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/translations';
import { getDestinations } from '../lib/content';
import type { DestinationTheme } from '../lib/destinations';
import { HeroShowcase } from './HeroShowcase';

type Theme = {
  id: string;
  titleKey: TranslationKey;
  tags: DestinationTheme[];
};

const themes: Theme[] = [
  { id: 'sea-adventure', titleKey: 'home.themeSea', tags: ['beach', 'adventure'] },
  { id: 'city', titleKey: 'home.themeCity', tags: ['city'] },
  { id: 'culture', titleKey: 'home.themeCulture', tags: ['culture'] },
  { id: 'food', titleKey: 'home.themeFood', tags: ['food'] },
  { id: 'traditional', titleKey: 'home.themeTraditional', tags: ['traditional'] },
];

export function InspirationCarousels() {
  const { language, t } = useI18n();
  const destinations = getDestinations(language);

  return (
    <div className="inspiration-carousels">
      {themes.map((theme, themeIndex) => {
        const matches = destinations
          .filter((destination) => theme.tags.some((tag) => destination.themeIds.includes(tag)))
          .sort((a, b) => b.visualScore - a.visualScore);
        if (matches.length < 3) return null;
        const headingId = `inspiration-${theme.id}`;
        return (
          <section className="themed-carousel" aria-labelledby={headingId} key={theme.id}>
            <header className="themed-carousel__heading">
              <span>{t('home.themeCollection')} · {String(matches.length).padStart(2, '0')}</span>
              <h3 id={headingId}>{t(theme.titleKey)}</h3>
            </header>
            <HeroShowcase destinations={matches} showPlanner={themeIndex === 0} />
          </section>
        );
      })}
    </div>
  );
}
