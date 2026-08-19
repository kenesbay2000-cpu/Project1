import type { DestinationGuide } from '../lib/destinationGuides';
import { useI18n } from '../i18n/I18nProvider';

export function DestinationCautions({ guide }: { guide: DestinationGuide }) {
  const { t } = useI18n();
  return (
    <section className="caution-section" id="cautions">
      <div className="caution-section__intro">
        <p className="article-kicker">{t('guide.knowAhead')}</p>
        <h2>{t('guide.calmTitle')}</h2>
        <p>{t('guide.calmText')}</p>
      </div>
      <div className="caution-list">
        {guide.cautions.map((item, index) => (
          <article key={item.title}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>
        ))}
      </div>
      <aside className="culture-note">
        <p className="article-kicker">{t('guide.culture')}</p><h3>{t('guide.prepareFor')}</h3>
        {guide.culture.map((text) => <p key={text}>{text}</p>)}
      </aside>
    </section>
  );
}
