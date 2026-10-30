import type { Health } from '../components/Health';
import type { MapObject } from '../content/maps/mapObjects.types';

/** Runtime record; Health remains the single damageable-state owner. */
export type WorldObjectRecord = {
  readonly object: MapObject;
  readonly entityId: string | null;
  readonly health: Health | null;
};
