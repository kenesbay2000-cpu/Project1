import type { DestinationGuide } from '../../../destinationGuides';

export const hongKongGuideEn: DestinationGuide = {
  lead: 'Hong Kong lives vertically: flyovers cross above crowded markets, green ridgelines rise behind the towers, and ferries glide between them every few minutes.',
  intro: [
    'Few megacities make it so easy to pair an urban day with a genuine hike. Central brings architecture and velocity, Kowloon brings markets and dense street life, while the islands open onto beaches and villages.',
    'Five days are enough to find the city’s rhythm; a week leaves room for trails and a misty day on the Peak. An Octopus card turns metro rides, ferries, and small purchases into one effortless system.',
  ],
  highlights: [
    { tag: 'Classic', title: 'Star Ferry and Victoria Peak', text: 'Cross the harbour in daylight, then head to the Peak near golden hour—provided the horizon is clear.' },
    { tag: 'Street life', title: 'Sham Shui Po and Yau Ma Tei', text: 'Markets, tea houses, old signs, and everyday Kowloon beyond the luxury storefronts.' },
    { tag: 'Trail', title: 'Dragon’s Back', text: 'An accessible walk with open sea views. Carry water and avoid setting out in the midday heat.' },
    { tag: 'Islands', title: 'Lamma or Cheung Chau', text: 'In under an hour, a ferry carries you from the business district to fishing streets and coastal paths.' },
  ],
  bestTime: 'October–December brings lower humidity, clearer skies, and better walking weather. Spring is mild but often misty.',
  climate: 'Summer is intensely hot and humid, with heavy downpours and a risk of typhoons. Winter is mild and dry; a light jacket can be useful after dark.',
  entry: 'Kazakhstani citizens may visit Hong Kong visa-free for up to 14 days. Longer stays or other purposes require permission; carrying proof of onward travel is sensible.',
  entrySource: { label: 'Hong Kong Immigration Department', url: 'https://www.immd.gov.hk/eng/services/visas/visit-transit/visit-visa-entry-permit.html' },
  budget: [
    { label: 'Hotel per night', value: '₸55,000–140,000', note: 'A compact room close to an MTR station' },
    { label: 'Food per day', value: '₸18,000–48,000', note: 'Cha chaan teng, dim sum, and dinner' },
    { label: 'Transport', value: '₸3,000–7,000', note: 'MTR, buses, and ferries' },
  ],
  essentials: [
    { label: 'Currency', value: 'Hong Kong dollar · HKD' }, { label: 'From the airport', value: 'Airport Express or bus' },
    { label: 'Ideal stay', value: '5–7 days' }, { label: 'Where to stay', value: 'Sheung Wan or Tsim Sha Tsui' },
  ],
  cautions: [
    { title: 'Tea invitations and shopping', text: 'Decline spontaneous “tea introductions” and check electronics shops carefully. Pressure tactics or an unclear final price are good reasons to leave.' },
    { title: 'Typhoons and trails', text: 'Weather signals affect transport and close routes. Stay off exposed ridges during storms, extreme heat, or heavy-rain warnings.' },
    { title: 'A dense city', text: 'Pickpocketing is uncommon but possible in markets and crowds. Stand on the right of escalators and keep exits clear.' },
  ],
  culture: ['Service can sound brisk and direct; it usually reflects pace rather than rudeness.', 'Do not leave chopsticks standing upright in rice, and avoid lingering over a table at peak hours—small restaurants rely on quick turnover.'],
};
