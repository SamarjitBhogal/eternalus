import type { MapFeatureKind } from '../content/maps/maps.types';

/** Feature kinds that get a fort drawn around their anchor. */
export const FORTIFIED_KINDS: ReadonlySet<MapFeatureKind> = new Set([
  'spawner-tower',
  'buff-tower',
  'capture-point',
]);

/** Feature kinds of the Stronghold wall: no mountain may touch one (HC-Q95). */
export const WALL_RING_KINDS: ReadonlySet<MapFeatureKind> = new Set([
  'gate',
  'wall-segment',
  'turret',
]);
