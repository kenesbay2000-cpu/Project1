import type { Language } from '../../i18n/translations';
import { destinationGuides } from '../destinationGuides';
import { destinations, type Destination } from '../destinations';
import { englishDestinations } from './en/destinations';
import { englishGuides } from './en/guides';
import type { DestinationContent } from './types';

const translatedContent: Partial<Record<Language, DestinationContent>> = {
  en: { destinations: englishDestinations, guides: englishGuides },
};

export function getDestinations(language: Language): Destination[] {
  const localized = translatedContent[language]?.destinations;
  if (!localized) return destinations;
  return destinations.map((destination) => ({
    ...destination,
    ...(localized[destination.slug] ?? {}),
  }));
}

export function getDestinationGuide(slug: string, language: Language) {
  return translatedContent[language]?.guides[slug] ?? destinationGuides[slug];
}
