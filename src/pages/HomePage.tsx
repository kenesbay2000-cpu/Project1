import { DestinationGrid } from '../components/DestinationGrid';
import { HeroShowcase } from '../components/HeroShowcase';
import { DestinationVote } from '../components/DestinationVote';
import { AIPlannerHero } from '../components/AIPlannerHero';
import { AIPlannerFeatures } from '../components/AIPlannerFeatures';
import { Link } from 'wouter';
import './HomePage.css';

export function HomePage() {
  return (
    <main className="home-page" data-header-overlay>
      <AIPlannerHero />
      <AIPlannerFeatures />

      <section className="home-discovery" data-header-theme="light" aria-labelledby="home-discovery-title">
        <header className="home-discovery__heading">
          <span>Продолжите с вдохновения</span>
          <h2 id="home-discovery-title">Присмотритесь к направлениям</h2>
          <p>Изучите популярные идеи, сравните ориентир бюджета и узнайте, куда мечтают отправиться другие путешественники.</p>
        </header>
        <HeroShowcase />
        <DestinationVote />
      </section>

      <section className="ideas" id="ideas" data-header-theme="light">
        <div className="ideas__heading">
          <div>
            <span className="section-label">Откройте новое</span>
            <h2>Идеи для вдохновения</h2>
          </div>
          <div className="ideas__aside">
            <p>Начните с места, которое отзывается: сравните атмосферу и примерный бюджет, а детали поездки доверьте AI Planner.</p>
            <div className="ideas__actions">
              <Link className="ideas__action ideas__action--primary" href="/destinations">Смотреть все направления <span>→</span></Link>
              <Link className="ideas__action ideas__action--secondary" href="/map">Смотреть на карте <span>⌖</span></Link>
            </div>
          </div>
        </div>
        <DestinationGrid />
      </section>
    </main>
  );
}
