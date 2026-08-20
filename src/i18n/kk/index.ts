import { accountKk } from './account';
import { catalogKk } from './catalog';
import { commonKk } from './common';
import { homeKk } from './home';
import { plannerKk } from './planner';
import { plansKk } from './plans';

export const kazakhTranslations = {
  ...homeKk,
  ...catalogKk,
  ...plannerKk,
  ...plansKk,
  ...accountKk,
  ...commonKk,
} as const;
