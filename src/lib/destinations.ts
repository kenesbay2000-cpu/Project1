import { coreDestinations } from './destinationCatalog/core';
import { visualBatchOne } from './destinationCatalog/visualBatchOne';
import type { Destination } from './destinationTypes';

export type { Destination, DestinationTheme, VisaCategory } from './destinationTypes';

export const destinations: Destination[] = [...coreDestinations, ...visualBatchOne];
