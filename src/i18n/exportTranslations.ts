const ru = {
  'export.actions': 'Экспорт плана',
  'export.downloadPdf': 'Скачать PDF',
  'export.downloadingPdf': 'Создаём PDF…',
  'export.print': 'Распечатать',
  'export.error': 'Не удалось создать PDF. Попробуйте ещё раз.',
  'export.timeoutError': 'PDF не удалось создать за 25 секунд. Попробуйте ещё раз.',
  'export.documentLabel': 'Персональный план путешествия',
  'export.routePoints': 'Точки маршрута',
  'export.routePointsNote': 'Статический список мест вместо интерактивной карты',
  'export.period': 'Даты поездки',
  'export.travelers': 'Путешественники',
  'export.totalBudget': 'Ориентировочный бюджет',
  'export.planningLogic': 'Логика маршрута',
  'export.realism': 'Реалистичность плана',
  'export.noRoutePoints': 'В маршруте нет точек с указанными местами.',
  'export.page': 'Страница {current} из {total}',
} as const;

const en: { [K in keyof typeof ru]: string } = {
  'export.actions': 'Plan export',
  'export.downloadPdf': 'Download PDF',
  'export.downloadingPdf': 'Creating PDF…',
  'export.print': 'Print',
  'export.error': 'We couldn’t create the PDF. Please try again.',
  'export.timeoutError': 'The PDF could not be created within 25 seconds. Please try again.',
  'export.documentLabel': 'Personal travel plan',
  'export.routePoints': 'Itinerary places',
  'export.routePointsNote': 'A static list of places in place of the interactive map',
  'export.period': 'Travel dates',
  'export.travelers': 'Travellers',
  'export.totalBudget': 'Estimated budget',
  'export.planningLogic': 'Planning logic',
  'export.realism': 'Plan realism',
  'export.noRoutePoints': 'No named places are included in this itinerary.',
  'export.page': 'Page {current} of {total}',
};

export const exportTranslations = { ru, en };
