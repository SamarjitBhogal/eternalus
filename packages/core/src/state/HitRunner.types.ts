import type { AbilityEffectSpec } from '../content/abilities/AbilityDefinition.types';
import type { UnitAttack } from '../content/units/units.types';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';

/**
 * A shot's owner as it was when it fired (`ProjectilePayload`): its team and level, where the
 * shot left from, and what the hit is credited to, whose `definitionId` names the attack's cast
 * (`weaponSourceOf`). The attack's `onHit` steps are cast from it when the owner left the store
 * before the shot landed (a turret destroyed while its bolt flies). A `ProjectileHit` fits.
 */
export type Shooter = {
  readonly team: Team | undefined;
  readonly ownerLevel: number;
  readonly origin: Vec2;
  readonly source: { readonly definitionId: string };
};

/**
 * Whatever runs the effects of a landed hit (the attack's own `onHit`, then the attacker's
 * statuses', architecture 05 §8 and §10): after a melee hit (`entities/strategies`) and after a
 * shot lands (`combat/WeaponImpact`). `abilities/HitEffects` satisfies it. A port in `state/`
 * because neither `entities/` nor `combat/` may import `abilities/`, and both may import `state/`
 * (02 §2).
 */
export type HitRunner = {
  /**
   * @param attack - The attack that struck (a shot's is the one it was fired with); absent runs
   *   only the statuses' `onHit`.
   * @param shooter - A shot's owner as it fired; the attack's `onHit` runs from it when the owner
   *   is gone. Absent (a melee hit): nothing runs for an attacker that is gone.
   */
  afterHit(
    state: GameState,
    attackerId: EntityId,
    targetId: EntityId,
    attack?: UnitAttack,
    shooter?: Shooter,
  ): void;
};

/**
 * Whatever runs a list of effect steps for a landed hit (a lit arrow's burn, `ProjectileSystem`,
 * HC-Q89, DEC-345). `abilities/HitEffects` satisfies it. Apart from `HitRunner`, so a consumer
 * that only runs the attack's own on-hit steps does not need it.
 */
export type StepRunner = {
  /**
   * Runs `steps` as one cast named `id` for a hit that just landed, credited to `attackerId` and
   * aimed at `targetId`, as the attack's own `onHit` runs, but not the attacker's statuses' steps.
   * A lit arrow's burn (`ProjectileSystem`, HC-Q89, DEC-345). Nothing runs for no steps, or when
   * the struck body or the attacker is gone and no `shooter` is given.
   *
   * @param id - The cast's name: the shot's definition id.
   * @param shooter - A shot's owner as it fired; the steps run from it when the owner is gone.
   */
  runSteps(
    state: GameState,
    attackerId: EntityId,
    targetId: EntityId,
    id: string,
    steps: readonly AbilityEffectSpec[],
    shooter?: Shooter,
  ): void;
};
