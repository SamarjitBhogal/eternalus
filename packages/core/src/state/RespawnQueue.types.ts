import type { Legend } from '../entities/Legend';
import type { PlayableTeam, Team } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';

/**
 * XP a Legend earned while it waited to respawn, paid when it returns (DEC-186 "pay on respawn"):
 * a structure its team destroyed, a boss its team killed, or a kill its projectile or damage over
 * time landed after it died. `cause` and `maxLevels` are the award's own.
 */
export type OwedXp = {
  readonly cause: 'kill' | 'structure-destroyed' | 'team-kill';
  readonly victimId: EntityId;
  readonly victimTeam: Team;
  readonly xp: number;
  /** How far a team-kill award may lift the Legend (DEC-237), applied when it is paid. */
  readonly maxLevels?: number;
};

/**
 * A dead Legend waiting to return (FR-051, DEC-295): the same `Legend` object, taken out of the
 * store without retiring it, so it keeps its id, level, XP, caps, loadout and controller.
 */
export type RespawnEntry = {
  readonly legend: Legend;
  readonly team: PlayableTeam;
  /** The first tick it may return. */
  readonly returnsAtTick: number;
  /** The XP it earned while waiting, in the order it was earned. */
  readonly owedXp: readonly OwedXp[];
};
