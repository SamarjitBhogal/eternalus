import type { AbilityKit } from '../abilities/AbilityDefinition.types';
import type { LevelCurveId, LevelScalingDefinition } from '../progression/progression.types';
import type { UnitDefinition } from '../units/units.types';

/** The MVP Legend classes (DEC-08: Assault is now Warrior). */
export type LegendKind = 'warrior' | 'sentinel' | 'magus';

/**
 * Content id of a Legend class (a `LegendDefinition` id: `'warrior'`, `'sentinel'`, `'magus'`). A
 * plain id, not a closed union, so other content (the bot roster, Legend specs) can name a class.
 */
export type LegendClassId = string;

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
 * Display names of a class's selection-screen detail rows (Figma 72:757); `null` until named.
 *
 * TODO(sam): each becomes an ability/weapon id when the kit is mapped (OQ-68).
 */
export type ClassDetailNames = {
  readonly signature: string | null;
  readonly proficiency: string | null;
  readonly specialty: string | null;
};

/**
 * A playable Legend class. Ability, passive and action ids name the class's options; their
 * ability definitions, loadouts and progression arrive in Phase 4.
 */
export type LegendDefinition = UnitDefinition & {
  /** Which Legend class builds it. */
  readonly kind: LegendKind;
  /** One line for the character-select screen. */
  readonly roleBlurb: string;
  /** Full aether (MP) pool; abilities and class default actions spend it (`01-classes`). */
  readonly baseAether: number;
  /** The XP table this class levels along (`content/progression/levelCurves.ts`). */
  readonly levelCurveId: LevelCurveId;
  /** What each level adds (06 XP-based scaling). */
  readonly levelScaling: LevelScalingDefinition;
  /** Role tag on the class card ("Assault", "Tank", "Ranged"; Figma 72:858–72:860). */
  readonly roleLabel: string;
  /** Resource and role line under the class name (Figma 72:749); `null` until written. */
  readonly tagline: string | null;
  /** Selection-screen lore paragraph (Figma 72:748); `null` until written. */
  readonly description: string | null;
  /**
   * The lore paragraph of the alternate class-select layout (Figma 62:82), which keeps its own
   * older copy; `null` shows `description` there too.
   */
  readonly alternateLayoutDescription: string | null;
  /** Names of the class's selection-screen detail rows (Figma 72:757); `null` until named. */
  readonly detailNames: ClassDetailNames;
  readonly weaponBias: WeaponBias;
  readonly damageFocus: DamageFocus;
  readonly pickUp: PickUpStyle;
  /**
   * Every ability and ultimate this class may equip, by content id (DEC-198): a loadout picks three
   * abilities and one ultimate from it. `KnownAbilityRefsRule` checks the ids.
   */
  readonly abilityPool: readonly string[];
  /**
   * The kit a Legend of this class equips unless its spec carries its own (`LegendSpecDefinition.kit`;
   * DEC-198, DEC-199, DEC-209 (2)); `KitInPoolRule` checks it against `abilityPool`.
   */
  readonly defaultKit: AbilityKit;
  /** The passives this class may choose from; empty when it has none. */
  readonly passiveOptions: readonly PassiveId[];
  /** The always-available action, or `null` when the class has none. */
  readonly defaultAction: DefaultActionId | null;
  /** Reference height in metres, for art and hit-box tuning (not used by physics). */
  readonly referenceHeight: number;
  /**
   * The one field of the design's `defaultLoadout: LoadoutTemplate` (04 §5) built so far: the weapon
   * the Legend spawns with (05 §12 `primaryWeaponId`, MVP). A Legend's damage comes from it.
   */
  readonly defaultLoadout: { readonly primaryWeaponId: string };
  /** A Legend attacks with its weapon, never an attack of its own (05 §10). */
  readonly attack?: never;
};
