import type { LegendDefinition } from '../content/legends/legends.types';
import type { WeaponDefinition } from '../content/weapons/weapons.types';
import type { Loadout } from './Loadout.types';

/** A part of a `Loadout` a problem is about: its class, or one of its slots (05 §12). */
export type LoadoutField = 'class' | 'primary-weapon';

/** One broken rule of a loadout (05 §12 `LoadoutProblem`). */
export type LoadoutProblem = {
  readonly field: LoadoutField;
  /** The `LoadoutRule.id` that found it. */
  readonly ruleId: string;
  readonly message: string;
};

/** A source of definitions by id, as a `ContentCatalogue` gives them. */
type Lookup<Definition> = {
  has(id: string): boolean;
  get(id: string): Definition;
};

/**
 * The content a loadout is checked against and auto-built from: each class's default loadout, and
 * which classes may carry each weapon. Core's catalogues satisfy it; the client builds one from
 * display content with `loadoutContentOf`.
 */
export type LoadoutContent = {
  readonly legends: Lookup<Pick<LegendDefinition, 'defaultLoadout'>>;
  readonly weapons: Lookup<Pick<WeaponDefinition, 'allowedClasses'>>;
};

/**
 * One loadout rule (05 §12): returns every problem it finds, and skips an id another rule reports
 * as unknown (`ContentExistsRule`), so a problem is reported once.
 */
export interface LoadoutRule {
  readonly id: string;
  check(loadout: Loadout, content: LoadoutContent): readonly LoadoutProblem[];
}
