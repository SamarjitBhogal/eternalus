import type { MapFeatureKind } from '../content/maps/maps.types';

/** Feature kinds that get a fort drawn around their anchor. */
export const FORTIFIED_KINDS: ReadonlySet<MapFeatureKind> = new Set([
  'spawner-tower',
  'buff-tower',
  'capture-point',
]);

/** Feature kinds that get a camp clearing drawn around their anchor. */
export const CAMP_KINDS: ReadonlySet<MapFeatureKind> = new Set(['camp', 'corner-camp']);
