import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { Entity } from '../entities/Entity';
import type { EntityFactory } from '../entities/EntityFactory';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';

/** Services injected by the ability system; effects never call another system. */
export type AbilityEffectContext = {
  readonly state: GameState;
  readonly caster: Entity;
  readonly abilityId: string;
  readonly point: Vec2;
  readonly damage: DamagePipeline;
  readonly statuses: StatusEffectApplier;
  readonly factory: EntityFactory;
};
