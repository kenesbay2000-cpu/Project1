import { baliGuideKk } from './bali';
import { istanbulGuideKk } from './istanbul';
import { singaporeGuideKk } from './singapore';
import { tokyoGuideKk } from './tokyo';
import type { DestinationGuide } from '../../../destinationGuides';

export const kazakhGuides: Record<string, DestinationGuide> = {
  istanbul: istanbulGuideKk,
  bali: baliGuideKk,
  tokyo: tokyoGuideKk,
  singapore: singaporeGuideKk,
};
