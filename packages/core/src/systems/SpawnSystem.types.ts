import type { HordeSteeringProfile, LaneAssessmentWeights } from '../content/ai/ai.types';
import type {
  CheckpointDefenderPlanDefinition,
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
  /** Each spawning structure kind's horde waves, in ticks (`loadSpawnWaves`). */
  readonly waves: Readonly<Record<string, readonly SpawnWaveDefinition[]>>;
  /** The spawn grid's spacing and width, and how far a horde spawned inside its structure walks out. */
  readonly steering: Pick<
    HordeSteeringProfile,
    'spawnSpacing' | 'spawnColumns' | 'deployClearance'
  >;
  readonly weights: LaneAssessmentWeights;
  /** The formation every horde marches in. */
  readonly formationId: string;
  /**
   * Each home's guard plan by structure or zone definition id (18 §7), in ticks
   * (`loadGuardPlans`).
   */
  readonly guards: Readonly<Record<string, GuardPlanDefinition>>;
  /** Each capture-point checkpoint's defenders, keyed by checkpoint (07 §7, 18 §7.1). */
  readonly defenders: Readonly<Record<number, CheckpointDefenderPlanDefinition>>;
};

/** One spawner's repeating wave, with its times in ticks (`loadSpawnWaves`, architecture 03 §10). */
export type ScheduledWave = {
  readonly spawner: Structure;
  readonly wave: SpawnWaveDefinition;
  /** The tick of the first wave: the countdown's end plus `firstAtTicks`. */
  readonly firstTick: number;
};

/** A capture point's `checkpoint` reached with a Legend present: `SpawnSystem` adds its defenders. */
export type CheckpointReached = { readonly pointId: string; readonly checkpoint: number };
