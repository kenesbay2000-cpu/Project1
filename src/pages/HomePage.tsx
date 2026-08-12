import { DestinationGrid } from '../components/DestinationGrid';
import { HeroShowcase } from '../components/HeroShowcase';
import './HomePage.css';

export function HomePage() {
  return (
    <main className="home-page">
      <HeroShowcase />

      <section className="ideas" id="ideas">
        <div className="ideas__heading">
          <div>
            <span className="section-label">Вдохновение для вас</span>
            <h2>Куда отправимся?</h2>
          </div>
          <p>Подборки с примерным бюджетом на всю поездку — перелёт, жильё и впечатления.</p>
        </div>
        <DestinationGrid />
      </section>
    </main>
  );
}
