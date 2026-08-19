import type { DestinationGuide } from '../lib/destinationGuides';
import { useI18n } from '../i18n/I18nProvider';

export function DestinationArticleIntro({ guide }: { guide: DestinationGuide }) {
  const { t } = useI18n();
  return (
    <section className="article-intro" id="guide">
      <aside className="article-toc">
        <p>{t('guide.inThisGuide')}</p>
        <a href="#see">{t('guide.whatToSee')}</a><a href="#practical">{t('guide.seasonBudget')}</a><a href="#cautions">{t('guide.goodToKnow')}</a>
      </aside>
      <div className="article-copy">
        <p className="article-kicker">{t('guide.whyGo')}</p>
        <h2>{guide.intro[0]}</h2>
        {guide.intro.slice(1).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <aside className="quick-facts">
        {guide.essentials.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
      </aside>
    </section>
  );
}
