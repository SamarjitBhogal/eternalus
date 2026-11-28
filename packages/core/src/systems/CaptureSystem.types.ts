import type { Capturable } from '../components/Capturable';
import type { ZoneArea } from '../components/ZoneArea';
import type { Entity } from '../entities/Entity';
import type { EntityId } from '../state/EntityStore.types';
import type { Team } from '../teams/teams.types';

/** The summed weight of the units of each side inside one zone this tick. */
export type SideWeights = Record<Team, number>;

/** Who stands on one zone this tick, from one pass over the living units. */
export type ZonePresence = {
  readonly weights: SideWeights;
  /** Each side's living Legends whose centre is on the zone's area, in store order. */
  readonly legendIds: Readonly<Record<Team, readonly EntityId[]>>;
};

/** One capture zone as `CaptureSystem` reads it in a tick. */
export type CaptureZone = {
  readonly entity: Entity;
  readonly capturable: Capturable;
  readonly area: ZoneArea;
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
