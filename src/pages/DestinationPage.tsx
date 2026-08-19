import { Link, useRoute } from 'wouter';
import { DestinationArticleIntro } from '../components/DestinationArticleIntro';
import { DestinationCautions } from '../components/DestinationCautions';
import { DestinationEssentials } from '../components/DestinationEssentials';
import { DestinationHero } from '../components/DestinationHero';
import { DestinationHighlights } from '../components/DestinationHighlights';
import { getDestinationGuide, getDestinations } from '../lib/content';
import './DestinationPage.css';
import './destinationArticle.css';
import { useI18n } from '../i18n/I18nProvider';

export function DestinationPage() {
  const { t, language } = useI18n();
  const [, params] = useRoute('/destinations/:slug');
  const destination = getDestinations(language).find((item) => item.slug === params?.slug);
  const guide = destination ? getDestinationGuide(destination.slug, language) : undefined;

  if (!destination || !guide) {
    return (
      <main className="placeholder-page">
        <section className="placeholder-card">
          <span>404</span><h1>{t('guide.notFound')}</h1>
          <Link href="/destinations">← {t('guide.backCatalog')}</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="destination-page" data-header-overlay>
      <DestinationHero destination={destination} lead={guide.lead} />
      <article className="destination-article" data-header-theme="light">
        <DestinationArticleIntro guide={guide} />
        <DestinationHighlights items={guide.highlights} />
        <DestinationEssentials destination={destination} guide={guide} />
        <DestinationCautions guide={guide} />
      </article>
      <section className="article-cta" data-header-theme="dark">
        <div><p className="article-kicker">{t('guide.nextStep')}</p><h2>{t('guide.planTitle')}</h2></div>
        <Link href="/planner">{t('guide.createRoute')} <span>→</span></Link>
      </section>
    </main>
  );
}
