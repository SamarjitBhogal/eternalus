import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { CastAim } from '../components/AbilitySlotRuntime.types';
import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import type { AbilityEffect } from './AbilityEffect.types';
import type { Ability } from './AbilityRegistry.types';
import type { AreaShape } from './shapes/AreaShape.types';
import type { TargetQuery } from './TargetQuery';

/** The facts of one cast, fixed when `AbilitySystem` starts it. */
export type CastFacts = {
  readonly casterId: EntityId;
  readonly ability: Ability;
  readonly slot: AbilitySlot;
  readonly aim: CastAim;
  /** The caster's position at the cast. */
  readonly origin: Vec2;
  readonly casterLevel: number;
  readonly tick: number;
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
