import type { Destination } from '../destinations';
import type { DestinationGuide } from '../destinationGuides';

export type DestinationText = Pick<Destination,
  'city' | 'country' | 'badge' | 'description' | 'visa' | 'season' | 'duration' |
  'price' | 'rating' | 'reviews' | 'region' | 'tags'
>;

export type DestinationContent = {
  destinations: Record<string, DestinationText>;
  guides: Record<string, DestinationGuide>;
};
