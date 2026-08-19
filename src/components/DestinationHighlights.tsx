import type { GuideHighlight } from '../lib/destinationGuides';
import { useI18n } from '../i18n/I18nProvider';

export function DestinationHighlights({ items }: { items: GuideHighlight[] }) {
  const { t } = useI18n();
  return (
    <section className="article-section" id="see">
      <div className="article-section__heading">
        <p className="article-kicker">{t('guide.highlights')}</p>
        <h2>{t('guide.whatToSee')}</h2>
        <p>{t('guide.highlightsText')}</p>
      </div>
      <div className="highlight-grid">
        {items.map((item, index) => (
          <article className="highlight-card" key={item.title}>
            <div className="highlight-card__top">
              <span>0{index + 1}</span><small>{item.tag}</small>
            </div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
