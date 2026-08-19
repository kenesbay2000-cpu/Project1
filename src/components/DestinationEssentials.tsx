import type { Destination } from '../lib/destinations';
import type { DestinationGuide } from '../lib/destinationGuides';
import { useI18n } from '../i18n/I18nProvider';

type Props = { destination: Destination; guide: DestinationGuide };

export function DestinationEssentials({ destination, guide }: Props) {
  const { t } = useI18n();
  return (
    <section className="article-section practical-section" id="practical">
      <div className="article-section__heading">
        <p className="article-kicker">{t('guide.beforeTrip')}</p>
        <h2>{t('guide.practical')}</h2>
      </div>
      <div className="season-grid">
        <article><span>01</span><h3>{t('guide.when')}</h3><p>{guide.bestTime}</p></article>
        <article><span>02</span><h3>{t('guide.climate')}</h3><p>{guide.climate}</p></article>
      </div>
      <div className="entry-card">
        <div><span className="entry-card__icon">◎</span><p className="article-kicker">{t('guide.entry')}</p></div>
        <h3>{destination.visa}</h3>
        <p>{guide.entry}</p>
        <a href={guide.entrySource.url} target="_blank" rel="noreferrer">{guide.entrySource.label} ↗</a>
      </div>
      <div className="budget-block">
        <div className="budget-block__intro">
          <p className="article-kicker">{t('guide.estimate')}</p><h3>{t('guide.howMuch')}</h3>
          <p>{t('guide.budgetNote')}</p>
        </div>
        <div className="budget-list">
          {guide.budget.map((item) => (
            <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></div>
          ))}
        </div>
      </div>
    </section>
  );
}
