export type VisaCategory = 'visa-free' | 'on-arrival' | 'advance';
export type DestinationTheme = 'city' | 'culture' | 'food' | 'beach' | 'nature' | 'adventure' | 'traditional';

export type Destination = {
  slug: string;
  city: string;
  country: string;
  description: string;
  visa: string;
  season: string;
  duration: string;
  price: string;
  rating: string;
  reviews: string;
  badge: string;
  image: string;
  region: string;
  tags: string[];
  themeIds: DestinationTheme[];
  priceValue: number;
  ratingValue: number;
  visualScore: number;
  visaCategory: VisaCategory;
  coordinates: [number, number];
};
