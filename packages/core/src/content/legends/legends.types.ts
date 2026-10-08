import type { UnitDefinition } from '../units/units.types';

/** The MVP Legend classes (DEC-08: Assault is now Warrior). */
export type LegendKind = 'warrior' | 'sentinel' | 'magus';

/** Which weapons a class favours (`01-classes-and-subclasses.md`, Classes table). */
export type WeaponBias = 'light' | 'heavy' | 'staff';

/** What kind of damage a class mostly deals. `mixed` is split between magic and physical. */
export type DamageFocus = 'physical' | 'magic' | 'mixed';

/** How a class picks up and throws objects (`01-classes`, Default interactives). */
export type PickUpStyle = 'pick-up' | 'grab' | 'levitate';

/** Passive abilities a class can put in its passive slot (`01-classes`, Passives). */
export type PassiveId = 'wrecking-run' | 'studious' | 'necromancy';

/** Actions a class always has, outside the loadout (`01-classes`, Class default actions). */
export type DefaultActionId = 'revive';

/**
 * A playable Legend class. Ability, passive and action ids name the class's options; their
 * ability definitions, loadouts and progression arrive in Phase 4.
 */
export type LegendDefinition = UnitDefinition & {
  readonly kind: LegendKind;
  /** One line for the character-select screen. */
  readonly roleBlurb: string;
  readonly weaponBias: WeaponBias;
  readonly damageFocus: DamageFocus;
  readonly pickUp: PickUpStyle;
  /** The passives this class may choose from; empty when it has none. */
  readonly passiveOptions: readonly PassiveId[];
  /** The always-available action, or `null` when the class has none. */
  readonly defaultAction: DefaultActionId | null;
  /** Reference height in metres, for art and hit-box tuning (not used by physics). */
  readonly referenceHeight: number;
};
