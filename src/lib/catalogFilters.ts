import type { Destination, VisaCategory } from './destinations';

export const PRICE_MIN = 400000;
export const PRICE_MAX = 2500000;
export const PRICE_STEP = 50000;

export const regions = ['Евразия', 'Кавказ', 'Европа', 'Восточная Азия', 'Юго-Восточная Азия', 'Южная Азия', 'Северная Америка'];
export const thematicTags = ['Пляж', 'Культура', 'Приключения', 'Город', 'Природа', 'Гастрономия', 'Традиции'];

export const visaOptions: { value: VisaCategory; label: string }[] = [
  { value: 'visa-free', label: 'Без визы' },
  { value: 'on-arrival', label: 'По прибытии' },
  { value: 'advance', label: 'Заранее' },
];

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'alphabetical';

export type CatalogFilters = {
  region: string;
  tags: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  visa: VisaCategory | 'all';
};

export const defaultFilters: CatalogFilters = {
  region: 'all', tags: [], minPrice: PRICE_MIN, maxPrice: PRICE_MAX, minRating: 0, visa: 'all',
};

export function filterDestinations(items: Destination[], filters: CatalogFilters) {
  return items.filter((item) => {
    const matchesRegion = filters.region === 'all' || item.region === filters.region;
    const matchesTags = filters.tags.length === 0 || filters.tags.some((tag) => item.tags.includes(tag));
    const matchesPrice = item.priceValue >= filters.minPrice && item.priceValue <= filters.maxPrice;
    const matchesRating = item.ratingValue >= filters.minRating;
    const matchesVisa = filters.visa === 'all' || item.visaCategory === filters.visa;
    return matchesRegion && matchesTags && matchesPrice && matchesRating && matchesVisa;
  });
}

export function sortDestinations(items: Destination[], sort: SortOption) {
  const sorted = [...items];
  if (sort === 'price-asc') return sorted.sort((a, b) => a.priceValue - b.priceValue);
  if (sort === 'price-desc') return sorted.sort((a, b) => b.priceValue - a.priceValue);
  if (sort === 'rating') return sorted.sort((a, b) => b.ratingValue - a.ratingValue);
  if (sort === 'alphabetical') return sorted.sort((a, b) => a.city.localeCompare(b.city, 'ru'));
  return sorted;
}

export function formatPrice(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₸`;
}
