import type { PlayableTeam } from '../teams/teams.types';
import type { HORDE_WEIGHT_CLASSES } from './Horde.constants';
import type { EntityId } from './EntityStore.types';

/** The unique id of a horde (`horde-1`, `horde-2`, ... from `HordeStore.nextId`). */
export type HordeId = string;

/** A group of lane minions that marches together (architecture 18 §4). Not an entity. */
export type Horde = {
  readonly id: HordeId;
  readonly team: PlayableTeam;
  readonly weightClass: (typeof HORDE_WEIGHT_CLASSES)[number];
  /** `MapLane.id`, as in the horde events' payload. */
  readonly lane: string;
  /** The formation the members keep (content by id, architecture 18 §5.1). */
  readonly formationId: string;
  /** In string order. */
  readonly memberIds: readonly EntityId[];
  /** The lowest member id in string order. */
  readonly leaderId: EntityId;
  /**
   * The formation anchor: world units along the lane from the horde's own gate (architecture
   * 18 §4).
   */
  readonly progress: number;
};
