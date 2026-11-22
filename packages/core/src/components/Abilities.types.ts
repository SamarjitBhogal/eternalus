import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { Vec2 } from '../utils/geometry.types';
import type { Aim } from './AbilitySlotRuntime.types';

/**
 * A cast whose later steps wait for their due tick (architecture 05 §4; Fury's dash after its
 * wind-up, DEC-283), kept on the caster's `Abilities` as plain data: ids and numbers, so
 * `StateHasher` hashes it and it leaves the match with its caster. `AbilitySystem` builds the
 * cast's `CastInstance` from it each tick a step is due.
 */
export type CastInProgress = {
  readonly abilityId: string;
  readonly slot: AbilitySlot;
  /** The aim the cast runs with (after its targeting), fixed at the cast. */
  readonly aim: Aim;
  /** The caster's position at the cast: the cast's direction runs from it to `aim.point`. */
  readonly origin: Vec2;
  /** The caster's level at the cast; the steps scale by it. */
  readonly casterLevel: number;
  /** The tick of the cast; a step is due `delayTicks` after it. */
  readonly tick: number;
  /** The index of the first step not fired yet. */
  readonly nextStep: number;
};
