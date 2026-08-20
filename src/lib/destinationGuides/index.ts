import { baliGuide } from './bali';
import { banffGuide } from './banff';
import { cappadociaGuide } from './cappadocia';
import { hongKongGuide } from './hongKong';
import { istanbulGuide } from './istanbul';
import { kyotoGuide } from './kyoto';
import { lauterbrunnenGuide } from './lauterbrunnen';
import { maldivesGuide } from './maldives';
import { nhaTrangGuide } from './nhaTrang';
import { romeGuide } from './rome';
import { santoriniGuide } from './santorini';
import { singaporeGuide } from './singapore';
import { tbilisiGuide } from './tbilisi';
import { tokyoGuide } from './tokyo';
import { visualBatchTwoGuides } from './visualBatchTwo';
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
  kyoto: kyotoGuide,
  santorini: santoriniGuide,
  cappadocia: cappadociaGuide,
  maldives: maldivesGuide,
  banff: banffGuide,
  lauterbrunnen: lauterbrunnenGuide,
  ...visualBatchTwoGuides,
};

export type { DestinationGuide, GuideHighlight } from './types';
