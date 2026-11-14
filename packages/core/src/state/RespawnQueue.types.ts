import type { ControllerSpawn } from '../entities/EntityFactory.types';
import type { PlayableTeam } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';

/**
 * A dead Legend waiting to return (FR-051): what is needed to rebuild the same Legend with the
 * same id, level, XP and caps, and the tick it comes back.
 */
export type RespawnEntry = {
  readonly entityId: EntityId;
  /** The entity kind the factory rebuilds it with. */
  readonly kind: string;
  readonly definitionId: string;
  readonly team: PlayableTeam;
  /** The bot controller it had; absent for the human's Legend. */
  readonly controller?: ControllerSpawn;
  readonly xp: number;
  readonly level: number;
  /** Health and aether caps at death (level-ups raise them). */
  readonly healthMax: number;
  readonly aetherMax: number;
  /** The first tick it may return. */
  readonly returnsAtTick: number;
};
