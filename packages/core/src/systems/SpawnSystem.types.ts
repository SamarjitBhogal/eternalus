import type { HordeSteeringProfile, LaneAssessmentWeights } from '../content/ai/ai.types';
import type {
  GuardPlanDefinition,
  OpeningWaveDefinition,
  SpawnWaveDefinition,
} from '../content/structures/structures.types';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { Structure } from '../entities/structures/Structure';

/** What `SpawnSystem` spawns, and how (architecture 18 §3); all of it content, injected. */
export type SpawnPlan = {
  /** Where each wave's mob definition, and so its entity kind, is looked up. */
  readonly definitions: DefinitionSource;
  readonly openingWave: OpeningWaveDefinition;
  /** Each spawning structure kind's horde waves. */
  readonly waves: Readonly<Record<string, readonly SpawnWaveDefinition[]>>;
  /** The spawn grid's spacing and width, and how far a horde spawned inside its structure walks out. */
  readonly steering: Pick<
    HordeSteeringProfile,
    'spawnSpacing' | 'spawnColumns' | 'deployClearance'
  >;
  readonly weights: LaneAssessmentWeights;
  /** The formation every horde marches in. */
  readonly formationId: string;
  /** Each structure kind's guards (18 §7). */
  readonly guards: Readonly<Record<string, GuardPlanDefinition>>;
};

/** One spawner's repeating wave, with its times converted to ticks once (architecture 03 §10). */
export type ScheduledWave = {
  readonly spawner: Structure;
  readonly wave: SpawnWaveDefinition;
  /** The tick of the first wave: the countdown's end plus `firstAtSeconds`. */
  readonly firstTick: number;
  readonly everyTicks: number;
};
