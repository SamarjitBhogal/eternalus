import type { HordeSteeringProfile, LaneAssessmentWeights } from '../content/ai/ai.types';
import type {
  OpeningWaveDefinition,
  SpawnWaveDefinition,
} from '../content/structures/structures.types';
import type { DefinitionSource } from '../entities/EntityFactory.types';

/** What `SpawnSystem` spawns, and how (architecture 18 §3); all of it content, injected. */
export type SpawnPlan = {
  /** Where each wave's mob definition, and so its entity kind, is looked up. */
  readonly definitions: DefinitionSource;
  readonly openingWave: OpeningWaveDefinition;
  /** Each spawning structure kind's horde waves. */
  readonly waves: Readonly<Record<string, readonly SpawnWaveDefinition[]>>;
  /** The spawn grid's spacing and width. */
  readonly steering: Pick<HordeSteeringProfile, 'spawnSpacing' | 'spawnColumns'>;
  readonly weights: LaneAssessmentWeights;
  /** The formation every horde marches in. */
  readonly formationId: string;
};
