import type { DestinationGuide } from '../../../destinationGuides';

export const tokyoGuideEn: DestinationGuide = {
  lead: 'Tokyo astonishes not through scale but precision: a metropolis of millions assembled from neighbourhoods, each with the coherence of its own small universe.',
  intro: [
    'A week can pass here without repeating the same kind of day: an early market, a quiet Shinto garden, Omotesando architecture, record shops, then dinner at an eight-seat counter.',
    'Do not plan by straight-line distance on a map—rail hubs define Tokyo more clearly than kilometres do. Group nearby districts and leave room for whatever catches your eye along the way.',
  ],
  highlights: [
    { tag: 'Old Tokyo', title: 'Asakusa and Yanaka', text: 'Temples, small workshops, and quiet residential streets reveal the city that existed before the glass towers.' },
    { tag: 'Urban theatre', title: 'Shibuya and Shinjuku', text: 'Arrive around dusk, when daytime efficiency gives way to an electric cityscape.' },
    { tag: 'Art', title: 'Ueno and contemporary museums', text: 'Set aside half a day, and reserve sought-after digital exhibitions well in advance.' },
    { tag: 'Beyond the city', title: 'A day trip', text: 'Kamakura, Nikko, or the Fuji area adds sea, forest, and temple architecture to the metropolitan experience.' },
  ],
  bestTime: 'Late March–April is beautiful and intensely popular. May and October–November are more comfortable for long walks and often less crowded.',
  climate: 'Summers are hot, humid, and rainy; August–September can bring typhoons. Winters are dry, bright, and cool, with snow uncommon in central Tokyo.',
  entry: 'Kazakhstani citizens travelling on an ordinary passport need a visa in advance. The embassy recommends applying early; standard issuance is stated as the fifth working day after application.',
  entrySource: { label: 'Embassy of Japan in Kazakhstan', url: 'https://www.kz.emb-japan.go.jp/itpr_ja/00_000296.html' },
  budget: [
    { label: 'Hotel per night', value: '₸45,000–110,000', note: 'A compact city hotel near a metro station' },
    { label: 'Food per day', value: '₸18,000–45,000', note: 'Cafés, ramen, and a good dinner' },
    { label: 'Transport', value: '₸4,000–9,000', note: 'Urban trains and metro' },
  ],
  essentials: [
    { label: 'Currency', value: 'Japanese yen · JPY' }, { label: 'From the airport', value: 'Train to your nearest major hub' },
    { label: 'Ideal stay', value: '6–9 days' }, { label: 'Where to stay', value: 'Ueno, Ginza, or Shibuya' },
  ],
  cautions: [
    { title: 'The last train', text: 'The metro does not run all night, while taxis are expensive. Check the final departure, especially when staying far from your evening neighbourhood.' },
    { title: 'Street touts', text: 'In Kabukicho, do not follow promoters into bars. Unclear fees and inflated bills are a known problem; choose venues independently.' },
    { title: 'Heat and natural hazards', text: 'In summer, heatstroke is a more immediate concern than street crime. Follow alerts for extreme heat, downpours, earthquakes, and typhoons.' },
  ],
  culture: ['Keep voices low on public transport and phones on silent; tipping is not expected.', 'Public bins are scarce, so carrying a small bag for rubbish is surprisingly useful. Queues and personal space are taken seriously.'],
};
