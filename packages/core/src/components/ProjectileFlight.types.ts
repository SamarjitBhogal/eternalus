import type { Vec2 } from '../utils/geometry.types';

/** A straight targeted bolt; positions and timing are simulation values, never screen values. */
export type Flight = {
  readonly attackerId: string;
  readonly targetId: string;
  readonly weaponId: string;
  readonly origin: Vec2;
  readonly destination: Vec2;
  readonly damage: number;
  readonly speed: number;
  readonly firedTick: number;
};
