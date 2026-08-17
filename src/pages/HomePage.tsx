import { DestinationGrid } from '../components/DestinationGrid';
import { HeroShowcase } from '../components/HeroShowcase';
import { DestinationVote } from '../components/DestinationVote';
import { AIPlannerHero } from '../components/AIPlannerHero';
import { AIPlannerFeatures } from '../components/AIPlannerFeatures';
import { Link } from 'wouter';
import './HomePage.css';

export function HomePage() {
  return (
    <main className="home-page">
      <AIPlannerHero />
      <AIPlannerFeatures />

      <section className="home-discovery" aria-labelledby="home-discovery-title">
        <header className="home-discovery__heading">
          <span>Продолжите с вдохновения</span>
          <h2 id="home-discovery-title">Присмотритесь к направлениям</h2>
          <p>Изучите популярные идеи, сравните ориентир бюджета и узнайте, куда мечтают отправиться другие путешественники.</p>
        </header>
        <HeroShowcase />
        <DestinationVote />
      </section>

      <section className="ideas" id="ideas">
        <div className="ideas__heading">
          <div>
            <span className="section-label">Вдохновение для вас</span>
            <h2>Куда отправимся?</h2>
          </div>
          <div className="ideas__aside">
            <p>Подборки с примерным бюджетом на всю поездку — перелёт, жильё и впечатления.</p>
            <Link href="/destinations">Смотреть все направления →</Link>
          </div>
        </div>
        <DestinationGrid />
      </section>
    </main>
  );
}
