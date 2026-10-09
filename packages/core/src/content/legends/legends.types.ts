import type { UnitDefinition } from '../units/units.types';

/** The MVP Legend classes (DEC-08: Assault is now Warrior). */
export type LegendKind = 'warrior' | 'sentinel' | 'magus';

/** Kebab-case id of the weapon group a class favours (`01-classes`, Classes table): `light`, `heavy`, `staff`. */
type WeaponBias = string;

/** What kind of damage a class mostly deals. `mixed` is split between magic and physical. */
type DamageFocus = 'physical' | 'magic' | 'mixed';

/** Kebab-case id of the pick-up strategy a class uses (`01-classes`, Default interactives). */
type PickUpStyle = string;

/** Kebab-case id of a passive ability (`01-classes`, Passives); a new passive is content only. */
type PassiveId = string;

/** Kebab-case id of an always-available class action (`01-classes`, Class default actions). */
type DefaultActionId = string;

/**
 * A playable Legend class. Ability, passive and action ids name the class's options; their
 * ability definitions, loadouts and progression arrive in Phase 4.
 */
export type LegendDefinition = UnitDefinition & {
  /** Which Legend class builds it. */
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
