import { Route, Switch } from 'wouter';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BlogPage } from './pages/BlogPage';
import { DestinationPage } from './pages/DestinationPage';
import { DestinationsPage } from './pages/DestinationsPage';
import { MapPage } from './pages/MapPage';
import { PlannerPage } from './pages/PlannerPage';
import { SiteHeader } from './components/SiteHeader';
import { PageTransition } from './components/PageTransition';

// Здесь живут только маршруты. Сами экраны складывай в src/pages/.
export default function App() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <PageTransition>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/destinations" component={DestinationsPage} />
          <Route path="/destinations/:slug" component={DestinationPage} />
          <Route path="/map" component={MapPage} />
          <Route path="/planner" component={PlannerPage} />
          <Route path="/blog" component={BlogPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </PageTransition>
    </div>
  );
}
