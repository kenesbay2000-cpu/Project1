import { accountKk } from './account';
import { catalogKk } from './catalog';
import { commonKk } from './common';
import { homeKk } from './home';
import { plannerKk } from './planner';
import { plansKk } from './plans';
import { exportKk } from './export';

export const kazakhTranslations = {
  ...homeKk,
  ...catalogKk,
  ...plannerKk,
  ...plansKk,
  ...accountKk,
  ...commonKk,
  ...exportKk,
} as const;
