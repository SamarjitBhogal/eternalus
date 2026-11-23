import { DamagePipeline } from '../../combat/DamagePipeline';
import { StatusEffectApplier } from '../../combat/StatusEffectApplier';
import { Transform } from '../../components/Transform';
import type { AbilityEffectSpec } from '../../content/abilities/AbilityDefinition.types';
import { loadKnockback } from '../../content/abilities/loadKnockback';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { loadStatusEffects } from '../../content/status-effects/loadStatusEffects';
import { STATUS_EFFECTS } from '../../content/status-effects/statusEffectCatalogue';
import { PROJECTILES } from '../../content/projectiles/projectileCatalogue';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { ShotLauncher } from '../../state/ShotLauncher.types';
import type { Vec2 } from '../../utils/geometry.types';
import { CastInstance } from '../CastInstance';
import { BuffEffect } from '../effects/BuffEffect';
import { DamageEffect } from '../effects/DamageEffect';
import { DashEffect } from '../effects/DashEffect';
import { DebuffEffect } from '../effects/DebuffEffect';
import { ExecuteEffect } from '../effects/ExecuteEffect';
import { KnockbackEffect } from '../effects/KnockbackEffect';
import { ProjectileEffect } from '../effects/ProjectileEffect';
import { TargetQuery } from '../TargetQuery';
import { fakeAbility, testAbilityRegistry } from './fakeAbilities';
import { RecordingLauncher } from './RecordingLauncher';

/**
 * How `castSteps` casts: the aim point (1 m east of the caster by default), the caster's level,
 * the damage pipeline (the shipped steps by default) and the shot launcher (a recording one by
 * default).
 */
type CastOptions = {
  readonly aim?: Vec2;
  readonly level?: number;
  readonly scaling?: Readonly<Record<string, { readonly perLevel: number }>>;
  readonly damage?: DamagePipeline;
  readonly launcher?: ShotLauncher;
};

/**
 * Casts a one-off ability made of `effects` for `casterId` at `state.tick`, as `AbilitySystem`
 * would after the checks: a real `CastInstance` with the seven shipped effect strategies, the
 * shipped shapes, one `DamagePipeline` (`options.damage`), one `StatusEffectApplier` and
 * `options.launcher`.
 */
export const castSteps = (
  state: GameState,
  casterId: EntityId,
  effects: readonly AbilityEffectSpec[],
  {
    aim,
    level = 1,
    scaling = {},
    damage = new DamagePipeline(),
    launcher = new RecordingLauncher(),
  }: CastOptions = {},
): void => {
  const registry = testAbilityRegistry(
    [
      new DamageEffect(),
      new DebuffEffect(STATUS_EFFECTS),
      new KnockbackEffect(loadKnockback(state.config.tickRate)),
      new DashEffect(),
      new BuffEffect(STATUS_EFFECTS),
      new ProjectileEffect(PROJECTILES),
      new ExecuteEffect(),
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
      launcher,
    },
  ).run({ from: origin, to: origin });
};
