import { Link, useRoute } from 'wouter';
import { DestinationArticleIntro } from '../components/DestinationArticleIntro';
import { DestinationCautions } from '../components/DestinationCautions';
import { DestinationEssentials } from '../components/DestinationEssentials';
import { DestinationHero } from '../components/DestinationHero';
import { DestinationHighlights } from '../components/DestinationHighlights';
import { destinations } from '../lib/destinations';
import { destinationGuides } from '../lib/destinationGuides';
import './DestinationPage.css';
import './destinationArticle.css';

export function DestinationPage() {
  const [, params] = useRoute('/destinations/:slug');
  const destination = destinations.find((item) => item.slug === params?.slug);
  const guide = destination ? destinationGuides[destination.slug] : undefined;

  if (!destination || !guide) {
    return (
      <main className="placeholder-page">
        <section className="placeholder-card">
          <span>404</span><h1>Направление не найдено</h1>
          <Link href="/destinations">← К каталогу</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="destination-page">
      <DestinationHero destination={destination} lead={guide.lead} />
      <article className="destination-article">
        <DestinationArticleIntro guide={guide} />
        <DestinationHighlights items={guide.highlights} />
        <DestinationEssentials destination={destination} guide={guide} />
        <DestinationCautions guide={guide} />
      </article>
      <section className="article-cta">
        <div><p className="article-kicker">Следующий шаг</p><h2>Соберите поездку под себя</h2></div>
        <Link href="/planner">Создать маршрут <span>→</span></Link>
      </section>
    </main>
  );
}
