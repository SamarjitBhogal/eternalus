import { DamagePipeline } from '../../combat/DamagePipeline';
import { StatusEffectApplier } from '../../combat/StatusEffectApplier';
import { Transform } from '../../components/Transform';
import type { AbilityEffectSpec } from '../../content/abilities/AbilityDefinition.types';
import { KNOCKBACK } from '../../content/abilities/knockback';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { loadStatusEffects } from '../../content/status-effects/loadStatusEffects';
import { STATUS_EFFECTS } from '../../content/status-effects/statusEffectCatalogue';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';
import { CastInstance } from '../CastInstance';
import { DamageEffect } from '../effects/DamageEffect';
import { DashEffect } from '../effects/DashEffect';
import { DebuffEffect } from '../effects/DebuffEffect';
import { KnockbackEffect } from '../effects/KnockbackEffect';
import { TargetQuery } from '../TargetQuery';
import { fakeAbility, testAbilityRegistry } from './fakeAbilities';

/**
 * How `castSteps` casts: the aim point (1 m east of the caster by default), the caster's level and
 * the damage pipeline (the shipped steps by default).
 */
type CastOptions = {
  readonly aim?: Vec2;
  readonly level?: number;
  readonly scaling?: Readonly<Record<string, { readonly perLevel: number }>>;
  readonly damage?: DamagePipeline;
};

/**
 * Casts a one-off ability made of `effects` for `casterId` at `state.tick`, as `AbilitySystem`
 * would after the checks: a real `CastInstance` with the four shipped effect strategies, the
 * shipped shapes, one `DamagePipeline` (`options.damage`) and one `StatusEffectApplier`.
 */
export const castSteps = (
  state: GameState,
  casterId: EntityId,
  effects: readonly AbilityEffectSpec[],
  { aim, level = 1, scaling = {}, damage = new DamagePipeline() }: CastOptions = {},
): void => {
  const registry = testAbilityRegistry(
    [
      new DamageEffect(),
      new DebuffEffect(STATUS_EFFECTS),
      new KnockbackEffect(KNOCKBACK),
      new DashEffect(),
    ],
    new ContentCatalogue([fakeAbility({ id: 'test-cast', effects, scaling })]),
  );
  const position = state.entities.get(casterId)?.getComponent(Transform).position ?? { x: 0, y: 0 };
  const origin = { x: position.x, y: position.y };
  new CastInstance(
    {
      casterId,
      ability: registry.resolve('test-cast'),
      slot: 'ability-1',
      aim: { point: aim ?? { x: origin.x + 1, y: origin.y }, targetId: null },
      origin,
      casterLevel: level,
      tick: state.tick,
    },
    {
      state,
      effects: registry,
      targets: new TargetQuery(registry),
      damage,
      statuses: new StatusEffectApplier(loadStatusEffects(state.config.tickRate, 2)),
    },
  ).run();
};
