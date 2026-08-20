import { DestinationGrid } from '../components/DestinationGrid';
import { InspirationCarousels } from '../components/InspirationCarousels';
import { DestinationVote } from '../components/DestinationVote';
import { AIPlannerHero } from '../components/AIPlannerHero';
import { AIPlannerFeatures } from '../components/AIPlannerFeatures';
import { Link } from 'wouter';
import './HomePage.css';
import { useI18n } from '../i18n/I18nProvider';

export function HomePage() {
  const { t } = useI18n();
  return (
    <main className="home-page" data-header-overlay>
      <AIPlannerHero />
      <AIPlannerFeatures />

      <section className="home-discovery" data-header-theme="light" aria-labelledby="home-discovery-title">
        <header className="home-discovery__heading">
          <span>{t('home.discoveryEyebrow')}</span>
          <h2 id="home-discovery-title">{t('home.discoveryTitle')}</h2>
          <p>{t('home.discoveryText')}</p>
        </header>
        <InspirationCarousels />
        <DestinationVote />
      </section>

      <section className="ideas" id="ideas" data-header-theme="light">
        <div className="ideas__heading">
          <div>
            <span className="section-label">{t('home.ideasEyebrow')}</span>
            <h2>{t('home.ideasTitle')}</h2>
          </div>
          <div className="ideas__aside">
            <p>{t('home.ideasText')}</p>
            <div className="ideas__actions">
              <Link className="ideas__action ideas__action--primary" href="/destinations">{t('home.allDestinations')} <span>→</span></Link>
              <Link className="ideas__action ideas__action--secondary" href="/map">{t('home.viewMap')} <span>⌖</span></Link>
            </div>
          </div>
        </div>
        <DestinationGrid />
      </section>
    </main>
  );
}
