import { useMemo, useState } from 'react';
import { CatalogDestinationCard } from '../components/CatalogDestinationCard';
import { CatalogFilterPanel } from '../components/CatalogFilterPanel';
import { defaultFilters, filterDestinations, PRICE_MAX, PRICE_MIN, sortDestinations, type CatalogFilters, type SortOption } from '../lib/catalogFilters';
import { destinations } from '../lib/destinations';
import './DestinationsPage.css';
import './catalogFilters.css';

export function DestinationsPage() {
  const [filters, setFilters] = useState<CatalogFilters>(defaultFilters);
  const [sort, setSort] = useState<SortOption>('featured');
  const results = useMemo(() => sortDestinations(filterDestinations(destinations, filters), sort), [filters, sort]);
  const activeCount = (filters.region !== 'all' ? 1 : 0) + filters.tags.length
    + (filters.minPrice !== PRICE_MIN || filters.maxPrice !== PRICE_MAX ? 1 : 0)
    + (filters.minRating > 0 ? 1 : 0) + (filters.visa !== 'all' ? 1 : 0);

  const resetFilters = () => setFilters({ ...defaultFilters });
  const resultLabel = results.length === 1 ? 'направление' : results.length >= 2 && results.length <= 4 ? 'направления' : 'направлений';

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <p className="section-label">Коллекция Roamly</p>
        <div><h1>Каталог<br /><em>направлений</em></h1><p>Места, ради которых стоит собрать чемодан. Сравните настроение, бюджет и детали въезда — всё остальное оставьте путешествию.</p></div>
      </header>
      <CatalogFilterPanel filters={filters} activeCount={activeCount} onChange={setFilters} onReset={resetFilters} />
      <section className="catalog-results" aria-live="polite">
        <div className="catalog-results__bar">
          <p><strong>{results.length}</strong> {resultLabel}</p>
          <label>Сортировка
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
              <option value="featured">Сначала рекомендуемые</option><option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option><option value="rating">По рейтингу</option><option value="alphabetical">По алфавиту</option>
            </select>
          </label>
        </div>
        {results.length > 0 ? <div className="catalog-grid">{results.map((destination) => <CatalogDestinationCard destination={destination} key={destination.slug} />)}</div> : (
          <div className="catalog-empty"><span>0 направлений</span><h2>Расширим горизонт?</h2><p>По этому сочетанию фильтров ничего не найдено. Сбросьте часть условий или начните сначала.</p><button type="button" onClick={resetFilters}>Сбросить фильтры</button></div>
        )}
      </section>
    </main>
  );
}
