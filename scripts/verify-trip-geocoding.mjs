import { createServer } from 'vite';

const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init = {}) => originalFetch(input, {
  ...init,
  headers: {
    ...init.headers,
    'User-Agent': 'Roamly-geocoding-verification/1.0 (+https://github.com/kenesbay2000-cpu/Project1)',
  },
});

const plans = [
  {
    name: 'Джакарта, Индонезия', city: 'Jakarta', country: 'Indonesia',
    center: { latitude: -6.2088, longitude: 106.8456 },
    places: [
      'Monumen Nasional', 'Museum Nasional Indonesia', 'Masjid Istiqlal',
      'Gereja Katedral Jakarta', 'Museum Fatahillah', 'Cafe Batavia',
      'Taman Mini Indonesia Indah', 'Hotel Indonesia Kempinski Jakarta',
    ],
  },
  {
    name: 'Сиануквиль, Камбоджа', city: 'Sihanoukville', country: 'Cambodia',
    center: { latitude: 10.6253, longitude: 103.5234 },
    places: [
      'Wat Leu Pagoda', 'Phsar Leu Market', 'ឆ្នេរអូរឈើទាល', 'Independence Beach',
      'Otres Beach', 'Kbal Chhay Waterfall', 'Ream National Park', 'Wat Krom',
    ],
  },
  {
    name: 'Киото, Япония', city: 'Kyoto', country: 'Japan',
    center: { latitude: 35.0116, longitude: 135.7681 },
    places: ['清水寺', '金閣寺', '伏見稲荷大社', '二条城', '京都御所', '八坂神社', '錦市場', '京都駅'],
  },
];

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const { geocodeMapFallback, geocodeMapQuery } = await server.ssrLoadModule('/src/lib/tripMapGeocoder.ts');
const { buildTripMapQueries } = await server.ssrLoadModule('/src/lib/tripMapGeocoding.ts');

try {
  for (const plan of plans) {
    const results = [];
    for (const place of plan.places) {
      const queries = buildTripMapQueries(place, '', plan.city, plan.country);
      let result = { status: 'empty' };
      for (const query of queries) {
        result = await geocodeMapQuery(query, plan.center, new AbortController().signal);
        if (result.status !== 'empty') break;
      }
      if (result.status === 'empty') {
        result = await geocodeMapFallback(place, plan.center, new AbortController().signal);
      }
      results.push({
        place,
        found: result.status === 'success',
        status: result.status,
        error: result.error ?? null,
        coordinates: result.coordinates ?? null,
      });
    }
    const found = results.filter((result) => result.found).length;
    console.log(JSON.stringify({ plan: plan.name, total: results.length, found, results }));
  }
} finally {
  await server.close();
}
