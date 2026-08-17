import { DestinationGrid } from '../components/DestinationGrid';
import { HeroShowcase } from '../components/HeroShowcase';
import { DestinationVote } from '../components/DestinationVote';
import { AIPlannerHero } from '../components/AIPlannerHero';
import { Link } from 'wouter';
import './HomePage.css';

export function HomePage() {
  return (
    <main className="home-page">
      <AIPlannerHero />

      <HeroShowcase />

      <DestinationVote />

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
