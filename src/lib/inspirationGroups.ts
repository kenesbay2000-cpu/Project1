import type { TranslationKey } from '../i18n/translations';
import type { Destination, DestinationTheme } from './destinations';

export type InspirationGroup = {
  id: string;
  titleKey: TranslationKey;
  destinations: Destination[];
};

type ThemeDefinition = { id: string; titleKey: TranslationKey; tags: DestinationTheme[] };
type RegionDefinition = { id: string; titleKey: TranslationKey; regions: string[] };

const themeDefinitions: ThemeDefinition[] = [
  { id: 'sea-adventure', titleKey: 'home.themeSea', tags: ['beach', 'adventure'] },
  { id: 'city', titleKey: 'home.themeCity', tags: ['city'] },
  { id: 'culture', titleKey: 'home.themeCulture', tags: ['culture'] },
  { id: 'food', titleKey: 'home.themeFood', tags: ['food'] },
  { id: 'traditional', titleKey: 'home.themeTraditional', tags: ['traditional'] },
];

const regionDefinitions: RegionDefinition[] = [
  { id: 'asia', titleKey: 'home.regionAsia', regions: ['Восточная Азия', 'Юго-Восточная Азия', 'Южная Азия', 'Центральная Азия', 'Евразия', 'Кавказ'] },
  { id: 'europe', titleKey: 'home.regionEurope', regions: ['Европа'] },
  { id: 'americas', titleKey: 'home.regionAmericas', regions: ['Северная Америка', 'Центральная Америка', 'Южная Америка', 'Карибы'] },
  { id: 'middle-east-africa', titleKey: 'home.regionMiddleEastAfrica', regions: ['Ближний Восток', 'Северная Африка', 'Восточная Африка', 'Южная Африка', 'Африка'] },
  { id: 'oceania', titleKey: 'home.regionOceania', regions: ['Австралия и Океания', 'Океания'] },
];

const sortByVisualImpact = (items: Destination[]) => [...items].sort((a, b) => b.visualScore - a.visualScore);

export function createThemeGroups(items: Destination[]): InspirationGroup[] {
  return themeDefinitions.map((definition) => ({
    id: definition.id,
    titleKey: definition.titleKey,
    destinations: sortByVisualImpact(items.filter((item) => definition.tags.some((tag) => item.themeIds.includes(tag)))),
  })).filter((group) => group.destinations.length >= 3);
}

export function createRegionGroups(localizedItems: Destination[], canonicalItems: Destination[]): InspirationGroup[] {
  const canonicalRegion = new Map(canonicalItems.map((item) => [item.slug, item.region]));
  return regionDefinitions.map((definition) => ({
    id: definition.id,
    titleKey: definition.titleKey,
    destinations: sortByVisualImpact(localizedItems.filter((item) => definition.regions.includes(canonicalRegion.get(item.slug) ?? ''))),
  })).filter((group) => group.destinations.length >= 3);
}
