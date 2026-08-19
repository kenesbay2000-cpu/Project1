import { useMemo, useState } from 'react';
import { CatalogDestinationCard } from '../components/CatalogDestinationCard';
import { CatalogFilterPanel } from '../components/CatalogFilterPanel';
import { defaultFilters, filterDestinations, PRICE_MAX, PRICE_MIN, sortDestinations, type CatalogFilters, type SortOption } from '../lib/catalogFilters';
import { destinations } from '../lib/destinations';
import './catalogPage.css';
import './catalogFilters.css';
import { useI18n } from '../i18n/I18nProvider';

export function DestinationsPage() {
  const { t } = useI18n();
  const [filters, setFilters] = useState<CatalogFilters>(defaultFilters);
  const [sort, setSort] = useState<SortOption>('featured');
  const results = useMemo(() => sortDestinations(filterDestinations(destinations, filters), sort), [filters, sort]);
  const activeCount = (filters.region !== 'all' ? 1 : 0) + filters.tags.length
    + (filters.minPrice !== PRICE_MIN || filters.maxPrice !== PRICE_MAX ? 1 : 0)
    + (filters.minRating > 0 ? 1 : 0) + (filters.visa !== 'all' ? 1 : 0);

  const resetFilters = () => setFilters({ ...defaultFilters });
  const resultLabel = results.length === 1 ? t('catalog.resultOne') : results.length >= 2 && results.length <= 4 ? t('catalog.resultFew') : t('catalog.resultMany');

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <p className="section-label">{t('catalog.eyebrow')}</p>
        <div><h1>{t('catalog.title')}<br /><em>{t('catalog.titleAccent')}</em></h1><p>{t('catalog.intro')}</p></div>
      </header>
      <CatalogFilterPanel filters={filters} activeCount={activeCount} onChange={setFilters} onReset={resetFilters} />
      <section className="catalog-results" aria-live="polite">
        <div className="catalog-results__bar">
          <p><strong>{results.length}</strong> {resultLabel}</p>
          <label>{t('catalog.sort')}
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
              <option value="featured">{t('catalog.sortFeatured')}</option><option value="price-asc">{t('catalog.sortCheap')}</option>
              <option value="price-desc">{t('catalog.sortExpensive')}</option><option value="rating">{t('catalog.sortRating')}</option><option value="alphabetical">{t('catalog.sortAlphabetical')}</option>
            </select>
          </label>
        </div>
        {results.length > 0 ? <div className="catalog-grid">{results.map((destination) => <CatalogDestinationCard destination={destination} key={destination.slug} />)}</div> : (
          <div className="catalog-empty"><span>{t('catalog.emptyCount')}</span><h2>{t('catalog.emptyTitle')}</h2><p>{t('catalog.emptyText')}</p><button type="button" onClick={resetFilters}>{t('catalog.reset')}</button></div>
        )}
      </section>
    </main>
  );
}
