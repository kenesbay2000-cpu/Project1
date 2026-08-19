import type { DestinationGuide } from '../../../destinationGuides';

export const singaporeGuideEn: DestinationGuide = {
  lead: 'Singapore is far more than a polished stopover: it is a dense tropical city where futuristic gardens sit beside neighbourhoods shaped by food, faith, and community.',
  intro: [
    'Explore it in layers: botanical gardens in the early morning, cool galleries and historic districts by day, then a hawker centre and the lights of Marina Bay after dark.',
    'Three or four days give a satisfying introduction. The city is compact and the MRT intuitive, but humidity changes the pace—build in pauses even when distances look short.',
  ],
  highlights: [
    { tag: 'Landscape', title: 'Gardens by the Bay', text: 'Arrive before sunset to see the gardens in daylight, then stay as the Supertrees begin to glow.' },
    { tag: 'Heritage', title: 'Kampong Glam and Katong', text: 'Textiles, shophouses, mosques, and Peranakan culture beyond the business district.' },
    { tag: 'Food', title: 'Hawker centres', text: 'Maxwell, Old Airport Road, or Tekka offer the clearest introduction to the city through dozens of kitchens at once.' },
    { tag: 'Nature', title: 'Southern Ridges', text: 'An elevated green route above the city—a reminder that Singapore remains an equatorial island.' },
  ],
  bestTime: 'February–April is often a little drier, though there is no guaranteed dry season. Major festivals are memorable, but accommodation prices rise.',
  climate: 'Hot and humid all year at roughly +26…+32 °C. Brief, intense rain can arrive any day, while indoor air conditioning is often surprisingly cold.',
  entry: 'Holders of ordinary Kazakhstani passports require an entry visa. Travellers must also submit the electronic SG Arrival Card within the prescribed period before arrival.',
  entrySource: { label: 'Immigration & Checkpoints Authority', url: 'https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements' },
  budget: [
    { label: 'Hotel per night', value: '₸65,000–150,000', note: 'A comfortable hotel near the MRT' },
    { label: 'Food per day', value: '₸16,000–45,000', note: 'Hawker food and dinner at a restaurant' },
    { label: 'Transport', value: '₸3,000–6,000', note: 'MRT and buses with contactless payment' },
  ],
  essentials: [
    { label: 'Currency', value: 'Singapore dollar · SGD' }, { label: 'From the airport', value: 'MRT or an official taxi' },
    { label: 'Ideal stay', value: '3–5 days' }, { label: 'Where to stay', value: 'Bugis or Tanjong Pagar' },
  ],
  cautions: [
    { title: 'Rules are enforced', text: 'Fines for smoking outside designated areas, littering, and transport violations are real. Pay attention to signs, especially around MRT stations and parks.' },
    { title: 'Online scams', text: 'Do not buy tickets or tours through random links in messaging apps. Use the attraction’s official website or a reputable platform.' },
    { title: 'Tropical weather', text: 'Sun and humidity drain energy quickly. During thunderstorms, leave open waterfronts and nature trails for a solid shelter.' },
  ],
  culture: ['At food courts, a packet of tissues or a card may be used to reserve a seat—do not move it.', 'This is a multilingual, multi-faith city: observe dress codes at temples and mosques, and never take food or drink onto the MRT.'],
};
