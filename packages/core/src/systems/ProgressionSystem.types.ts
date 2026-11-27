import type { ContentCatalogue } from '../content/ContentCatalogue';
import type {
  LevelCurveDefinition,
  XpSourcesDefinition,
} from '../content/progression/progression.types';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { EntityId } from '../state/EntityStore.types';
import type { PlayableTeam, Team } from '../teams/teams.types';

/** The content `ProgressionSystem` prices kills and levels with, injected (AGENTS rule 11). */
export type ProgressionContent = {
  /** Entity definitions by id: a mob's `xpValue`, a Legend's `baseHealth` and `levelScaling`. */
  readonly units: DefinitionSource;
  /** Level curves by id (`Progression.curveId`). */
  readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>;
  readonly xpSources: XpSourcesDefinition;
  /**
   * When set, every Legend that spawns starts at its curve's cap, its health and aether raised by
   * each level (a Duel, `DUEL_RULES.legendsStartAtMaxLevel`, SCRUM-444). Mobs are untouched.
   */
  readonly legendsStartAtMaxLevel?: boolean;
};

/** One kill waiting for this system's pass. */
type KillAward = {
  readonly kind: 'kill';
  readonly killerId: EntityId;
  readonly victimId: EntityId;
  readonly victimTeam: Team;
  readonly xp: number;
};

/** One cleared camp waiting for this system's pass: the bonus to its last mob's killer. */
type CampAward = Omit<KillAward, 'kind'> & { readonly kind: 'camp-cleared' };

/** One Legend's share of a cleared checkpoint set's XP (07 §7), paid like a kill. */
type CheckpointAward = Omit<KillAward, 'kind'> & { readonly kind: 'checkpoint-cleared' };

/**
 * One team-wide award: `xp` for every Legend of `team`, for a structure it destroyed (DEC-186) or a
 * boss its unit killed (`team-kill`, DEC-237). `maxLevels` caps how far it lifts each Legend.
 */
type TeamAward = {
  readonly kind: 'structure-destroyed' | 'team-kill';
  readonly team: PlayableTeam;
  readonly victimId: EntityId;
  readonly victimTeam: Team;
  readonly xp: number;
  readonly maxLevels?: number;
};

/**
 * XP a Legend was owed while it waited to respawn, paid to it in the pass after it returns
 * (DEC-186 "pay on respawn"); `maxLevels` is the owed team-kill's cap, applied then.
 */
type RespawnAward = {
  readonly kind: 'respawn';
  readonly recipientId: EntityId;
  readonly victimId: EntityId;
  readonly victimTeam: Team;
  readonly xp: number;
  readonly maxLevels?: number;
};

/** An award paid to one Legend by id (its killer, or its share), owed while it waits to respawn. */
export type PersonalAward = KillAward | CampAward | CheckpointAward;

/** One award this system gives, waiting for its pass. */
export type Award = KillAward | CampAward | CheckpointAward | TeamAward | RespawnAward;
