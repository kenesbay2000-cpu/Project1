import type { CatalogFilters } from '../lib/catalogFilters';
import { formatPrice, PRICE_MAX, PRICE_MIN, PRICE_STEP, regions, thematicTags, visaOptions } from '../lib/catalogFilters';

type Props = {
  filters: CatalogFilters;
  activeCount: number;
  onChange: (filters: CatalogFilters) => void;
  onReset: () => void;
};

export function CatalogFilterPanel({ filters, activeCount, onChange, onReset }: Props) {
  const toggleTag = (tag: string) => {
    const tags = filters.tags.includes(tag) ? filters.tags.filter((item) => item !== tag) : [...filters.tags, tag];
    onChange({ ...filters, tags });
  };

  return (
    <section className="catalog-filters" aria-label="Фильтры направлений">
      <div className="catalog-filters__top">
        <div><span className="catalog-filters__icon">⌁</span><h2>Подберите своё направление</h2></div>
        <button type="button" onClick={onReset} disabled={activeCount === 0}>Сбросить всё{activeCount > 0 && ` · ${activeCount}`}</button>
      </div>
      <div className="catalog-filters__grid">
        <label className="filter-field">
          <span>Регион</span>
          <select value={filters.region} onChange={(event) => onChange({ ...filters, region: event.target.value })}>
            <option value="all">Все регионы</option>
            {regions.map((region) => <option value={region} key={region}>{region}</option>)}
          </select>
        </label>
        <fieldset className="filter-field rating-filter">
          <legend>Рейтинг от</legend>
          <div>
            {[{ value: 0, label: 'Любой' }, { value: 4.8, label: '4,8+' }, { value: 4.9, label: '4,9' }].map((option) => (
              <button type="button" aria-pressed={filters.minRating === option.value} onClick={() => onChange({ ...filters, minRating: option.value })} key={option.label}>{option.label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="filter-field visa-filter">
          <legend>Визовый режим</legend>
          <div>
            <button type="button" aria-pressed={filters.visa === 'all'} onClick={() => onChange({ ...filters, visa: 'all' })}>Любой</button>
            {visaOptions.map((option) => <button type="button" aria-pressed={filters.visa === option.value} onClick={() => onChange({ ...filters, visa: option.value })} key={option.value}>{option.label}</button>)}
          </div>
        </fieldset>
      </div>
      <fieldset className="price-filter">
        <legend>Бюджет на поездку</legend>
        <div className="price-filter__values"><span>от {formatPrice(filters.minPrice)}</span><span>до {formatPrice(filters.maxPrice)}</span></div>
        <div className="price-filter__ranges">
          <input aria-label="Минимальная цена" type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={filters.minPrice} onChange={(event) => onChange({ ...filters, minPrice: Math.min(Number(event.target.value), filters.maxPrice) })} />
          <input aria-label="Максимальная цена" type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={filters.maxPrice} onChange={(event) => onChange({ ...filters, maxPrice: Math.max(Number(event.target.value), filters.minPrice) })} />
        </div>
      </fieldset>
      <fieldset className="tag-filter">
        <legend>Что вам интересно <small>любой из выбранных тегов</small></legend>
        <div>{thematicTags.map((tag) => <button type="button" aria-pressed={filters.tags.includes(tag)} onClick={() => toggleTag(tag)} key={tag}>{tag}<span>+</span></button>)}</div>
      </fieldset>
    </section>
  );
}
