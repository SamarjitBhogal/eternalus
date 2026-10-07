import type { UnitDefinition } from '../units/units.types';

/** The MVP Legend classes (DEC-08: Assault is now Warrior). */
export type LegendKind = 'warrior' | 'sentinel' | 'magus';

/** A playable Legend class. Abilities, loadouts and progression are added in Phase 4. */
export type LegendDefinition = UnitDefinition & {
  readonly kind: LegendKind;
  /** One line for the character-select screen. */
  readonly roleBlurb: string;
};
