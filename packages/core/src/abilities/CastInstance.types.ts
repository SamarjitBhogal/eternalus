import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { CastInProgress } from '../components/Abilities.types';
import type { AreaAttacker } from '../state/AreaHitQuery.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { AbilityEffect } from './AbilityEffect.types';
import type { Ability, ComposableAbility } from './AbilityRegistry.types';
import type { AreaShape } from './shapes/AreaShape.types';
import type { TargetQuery } from './TargetQuery';

/**
 * What a cast reads of the ability it runs: the id (the source of its damage), the bound steps and
 * the per-level scaling. A composed `Ability` fits; so do a status's bound `onHit` steps
 * (`HitEffects`), with the status's id and no scaling.
 */
type CastSource = Pick<Ability, 'id' | 'steps'> & {
  readonly definition: Pick<ComposableAbility, 'scaling'>;
};

/**
 * The facts of one cast, fixed when `AbilitySystem` (or `HitEffects`, on a hit) starts it: the
 * fields of a `CastInProgress` (its aim, origin, level and tick) with the caster and the bound
 * ability in place of the ability's id and the step counter.
 */
export type CastFacts = Omit<CastInProgress, 'abilityId' | 'nextStep'> & {
  readonly casterId: EntityId;
  readonly ability: CastSource;
  /**
   * The caster's team and position for the steps' areas (`AreaHitQuery`); absent, the store's.
   * `HitEffects` sets it, so the steps of a shot whose owner left the store still hit that
   * owner's enemies, not its allies.
   */
  readonly caster?: AreaAttacker;
};

/** What a cast's effects work with: the match's state, pipeline, applier and lookups. */
export type CastServices = {
  readonly state: GameState;
  /** Where effect and shape strategies are found (the `AbilityRegistry`). */
  readonly effects: { effectFor(kind: string): AbilityEffect; shapeFor(kind: string): AreaShape };
  readonly targets: TargetQuery;
  readonly damage: DamagePipeline;
  readonly statuses: StatusEffectApplier;
};
