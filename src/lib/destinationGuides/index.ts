import { baliGuide } from './bali';
import { hongKongGuide } from './hongKong';
import { istanbulGuide } from './istanbul';
import { nhaTrangGuide } from './nhaTrang';
import { romeGuide } from './rome';
import { singaporeGuide } from './singapore';
import { tbilisiGuide } from './tbilisi';
import { tokyoGuide } from './tokyo';
import type { DestinationGuide } from './types';

export const destinationGuides: Record<string, DestinationGuide> = {
  istanbul: istanbulGuide,
  bali: baliGuide,
  tokyo: tokyoGuide,
  singapore: singaporeGuide,
  tbilisi: tbilisiGuide,
  'hong-kong': hongKongGuide,
  rome: romeGuide,
  'nha-trang': nhaTrangGuide,
};

export type { DestinationGuide, GuideHighlight } from './types';
