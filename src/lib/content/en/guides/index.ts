import { baliGuideEn } from './bali';
import { hongKongGuideEn } from './hongKong';
import { istanbulGuideEn } from './istanbul';
import { nhaTrangGuideEn } from './nhaTrang';
import { romeGuideEn } from './rome';
import { singaporeGuideEn } from './singapore';
import { tbilisiGuideEn } from './tbilisi';
import { tokyoGuideEn } from './tokyo';
import type { DestinationGuide } from '../../../destinationGuides';

export const englishGuides: Record<string, DestinationGuide> = {
  istanbul: istanbulGuideEn,
  bali: baliGuideEn,
  tokyo: tokyoGuideEn,
  singapore: singaporeGuideEn,
  tbilisi: tbilisiGuideEn,
  'hong-kong': hongKongGuideEn,
  rome: romeGuideEn,
  'nha-trang': nhaTrangGuideEn,
};
