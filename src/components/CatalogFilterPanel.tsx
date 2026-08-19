import { useI18n } from '../i18n/I18nProvider';
import type { CatalogFilters } from '../lib/catalogFilters';
import { formatPrice, PRICE_MAX, PRICE_MIN, PRICE_STEP, regions, thematicTags, visaOptions } from '../lib/catalogFilters';

type Props = { filters: CatalogFilters; activeCount: number; onChange: (filters: CatalogFilters) => void; onReset: () => void };

export function CatalogFilterPanel({ filters, activeCount, onChange, onReset }: Props) {
  const { t } = useI18n();
  const regionLabels = [t('filters.regionEurasia'), t('filters.regionCaucasus'), t('filters.regionEurope'), t('filters.regionEastAsia'), t('filters.regionSoutheastAsia')];
  const tagLabels = [t('filters.beach'), t('filters.culture'), t('filters.adventure'), t('filters.city'), t('filters.nature'), t('filters.food')];
  const visaLabels = [t('filters.visaFree'), t('filters.visaArrival'), t('filters.visaAdvance')];
  const toggleTag = (tag: string) => onChange({ ...filters, tags: filters.tags.includes(tag) ? filters.tags.filter((item) => item !== tag) : [...filters.tags, tag] });

  return (
    <section className="catalog-filters" aria-label={t('filters.label')}>
      <div className="catalog-filters__top">
        <div><span className="catalog-filters__icon">⌁</span><h2>{t('filters.title')}</h2></div>
        <button type="button" onClick={onReset} disabled={activeCount === 0}>{t('filters.resetAll')}{activeCount > 0 && ` · ${activeCount}`}</button>
      </div>
      <div className="catalog-filters__grid">
        <label className="filter-field"><span>{t('filters.region')}</span><select value={filters.region} onChange={(event) => onChange({ ...filters, region: event.target.value })}>
          <option value="all">{t('filters.allRegions')}</option>{regions.map((region, index) => <option value={region} key={region}>{regionLabels[index]}</option>)}
        </select></label>
        <fieldset className="filter-field rating-filter"><legend>{t('filters.rating')}</legend><div>
          {[{ value: 0, label: t('filters.any') }, { value: 4.8, label: '4.8+' }, { value: 4.9, label: '4.9' }].map((option) => <button type="button" aria-pressed={filters.minRating === option.value} onClick={() => onChange({ ...filters, minRating: option.value })} key={option.label}>{option.label}</button>)}
        </div></fieldset>
        <fieldset className="filter-field visa-filter"><legend>{t('filters.visa')}</legend><div>
          <button type="button" aria-pressed={filters.visa === 'all'} onClick={() => onChange({ ...filters, visa: 'all' })}>{t('filters.any')}</button>
          {visaOptions.map((option, index) => <button type="button" aria-pressed={filters.visa === option.value} onClick={() => onChange({ ...filters, visa: option.value })} key={option.value}>{visaLabels[index]}</button>)}
        </div></fieldset>
      </div>
      <fieldset className="price-filter"><legend>{t('filters.budget')}</legend>
        <div className="price-filter__values"><span>{t('filters.from', { price: formatPrice(filters.minPrice) })}</span><span>{t('filters.to', { price: formatPrice(filters.maxPrice) })}</span></div>
        <div className="price-filter__ranges">
          <input aria-label={t('filters.minPrice')} type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={filters.minPrice} onChange={(event) => onChange({ ...filters, minPrice: Math.min(Number(event.target.value), filters.maxPrice) })} />
          <input aria-label={t('filters.maxPrice')} type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={filters.maxPrice} onChange={(event) => onChange({ ...filters, maxPrice: Math.max(Number(event.target.value), filters.minPrice) })} />
        </div>
      </fieldset>
      <fieldset className="tag-filter"><legend>{t('filters.interests')} <small>{t('filters.anyTag')}</small></legend>
        <div>{thematicTags.map((tag, index) => <button type="button" aria-pressed={filters.tags.includes(tag)} onClick={() => toggleTag(tag)} key={tag}>{tagLabels[index]}<span>+</span></button>)}</div>
      </fieldset>
    </section>
  );
}
