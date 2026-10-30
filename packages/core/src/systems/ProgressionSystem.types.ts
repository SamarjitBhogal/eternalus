import type { ContentCatalogue } from '../content/ContentCatalogue';
import type {
  LevelCurveDefinition,
  XpSourcesDefinition,
} from '../content/progression/progression.types';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { EntityId } from '../state/EntityStore.types';
import type { Team } from '../teams/teams.types';

/** The content `ProgressionSystem` prices kills and levels with, injected (AGENTS rule 11). */
export type ProgressionContent = {
  /** Entity definitions by id: a mob's `xpValue`, a Legend's `baseHealth` and `levelScaling`. */
  readonly units: DefinitionSource;
  /** Level curves by id (`Progression.curveId`). */
  readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>;
  readonly xpSources: XpSourcesDefinition;
};

/** One kill waiting for this system's pass. */
export type Award = {
  readonly killerId: EntityId;
  readonly victimId: EntityId;
  readonly victimTeam: Team;
  readonly xp: number;
};
