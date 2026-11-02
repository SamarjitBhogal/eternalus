import type { Capturable } from '../components/Capturable';
import type { Entity } from '../entities/Entity';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/** The summed weight of the units of each side inside one zone this tick. */
export type SideWeights = Record<Team, number>;

/** One capture zone as `CaptureSystem` reads it in a tick. */
export type CaptureZone = {
  readonly entity: Entity;
  readonly capturable: Capturable;
  readonly center: Vec2;
  readonly radius: number;
};

/** Where a zone's progress heads this tick and how far it may move. */
export type CaptureMove = {
  /** The locking progress it heads for: +1 Light, -1 Dark, 0 neutral. */
  readonly target: number;
  /** The most it moves this tick. */
  readonly step: number;
  /** The side pushing it, or `null` when it falls back on its own (nobody inside). */
  readonly leader: Team | null;
};
