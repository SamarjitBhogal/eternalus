/**
 * An ability bar slot (architecture 05 §6); `ability-4` is the ultimate. Content owns it because
 * a kit names abilities by slot order; `commands/Command.types.ts` re-exports it.
 */
export type AbilitySlot =
  | 'ability-1'
  | 'ability-2'
  | 'ability-3'
  | 'ability-4'
  | 'gadget-1'
  | 'gadget-2'
  | 'default-action';

/**
 * Why a cast was refused (05 §6). `unavailable`: the ability has no effects yet (`effects: []`),
 * so it is in a kit but cannot be cast until its class's PR builds it.
 */
export type AbilityRejectReason =
  | 'empty-slot'
  | 'dead'
  | 'on-cooldown'
  | 'not-enough-aether'
  | 'not-charged'
  | 'casting'
  | 'cannot-cast'
  | 'no-target'
  | 'restricted'
  | 'unavailable';

/**
 * Which kind of slot an ability fills (05 §2). `gadget`, `default-action` and `passive` join when
 * the first ability of that kind is built.
 */
type AbilitySlotKind = 'ability' | 'ultimate';

/**
 * How a cast is aimed (05 §2): `self` acts around the caster; `directional` follows the aim vector
 * with no range (dashes). `aimed` and `target-unit` join with their first ability.
 */
type AbilityTargeting = { readonly kind: 'self' } | { readonly kind: 'directional' };

/**
 * The area an effect step covers (05 §3). `circle` is centred on the caster, or on the dash's end
 * for a dash's `onEnd` step; `path` is the capsule a dash sweeps, `width` metres across (its length
 * is the dash's `distance`). `cone` joins with Rip & Tear (DEC-206).
 */
export type EffectShape =
  | { readonly kind: 'circle'; readonly radius: number }
  | { readonly kind: 'path'; readonly width: number };

/** What kind of damage a hit deals (`balancing.md` ability table). */
type DamageType = 'physical' | 'magical';

/** Damages every target in `shape` (05 §3 `DamageEffect`). */
export type DamageSpec = {
  readonly kind: 'damage';
  readonly amount: number;
  readonly damageType: DamageType;
  readonly shape: EffectShape;
  /** Damage multiplier against structures and obstacles; absent = 1. */
  readonly structureMultiplier?: number;
};

/**
 * Pushes every target in `shape` away from the shape's centre (05 §3 `KnockbackEffect`; forced
 * motion, not an impulse, plan arch call 6): `distance` metres for a target of base mass, less for
 * a heavier one (DEC-208, `knockback.ts`). `knockup` also applies the `knockup` status.
 */
export type KnockbackSpec = {
  readonly kind: 'knockback';
  readonly distance: number;
  readonly knockup?: boolean;
  readonly shape: EffectShape;
};

/** Applies a negative status to every target in `shape` (05 §3 `DebuffEffect`); seconds as authored. */
type AuthoredDebuffSpec = {
  readonly kind: 'debuff';
  readonly statusId: string;
  /** Overrides the status's own duration; absent = the status's duration. */
  readonly durationSeconds?: number;
  readonly shape: EffectShape;
};

/**
 * `T` as loaded (architecture 03 §11): every `<name>Seconds` field, at any depth, becomes
 * `<name>Ticks`. `loadAbilities` converts every authored time this way, whatever the step's kind,
 * so a new effect kind needs no loader change.
 */
export type InTicks<T> = T extends readonly (infer Item)[]
  ? readonly InTicks<Item>[]
  : T extends object
    ? {
        readonly [K in keyof T as K extends `${infer Name}Seconds` ? `${Name}Ticks` : K]: InTicks<
          T[K]
        >;
      }
    : T;

/** A loaded debuff: the duration override in ticks. */
export type DebuffSpec = InTicks<AuthoredDebuffSpec>;

/** An effect that acts on the targets in its `shape`, as authored. */
type AuthoredShapedEffectSpec = DamageSpec | KnockbackSpec | AuthoredDebuffSpec;

/** An effect that acts on the targets in its `shape`, loaded. */
export type ShapedEffectSpec = InTicks<AuthoredShapedEffectSpec>;

/**
 * Moves the caster `distance` metres along the aim (05 §3 `DashEffect`); `onPath` runs on the
 * units the dash sweeps, `onEnd` where it stops. Seconds as authored.
 */
type AuthoredDashSpec = {
  readonly kind: 'dash';
  readonly distance: number;
  readonly durationSeconds: number;
  readonly onPath: readonly AuthoredShapedEffectSpec[];
  readonly onEnd: readonly AuthoredShapedEffectSpec[];
};

/** A loaded dash: its duration in ticks. */
export type DashSpec = InTicks<AuthoredDashSpec>;

/** One step of an ability's cast timeline as authored (05 §3); one effect strategy per `kind`. */
export type AuthoredEffectSpec = AuthoredShapedEffectSpec | AuthoredDashSpec;

/** One loaded step of an ability's cast timeline: every time in ticks. */
export type AbilityEffectSpec = InTicks<AuthoredEffectSpec>;

/**
 * What `loadAbilities` reads of any effect step: its kind. The shipped steps are
 * `AuthoredEffectSpec`; a test may author a kind that union does not list (the Fake Bolt litmus,
 * 05 §16). Each kind's fields are its strategy's to check (`AbilityEffect.validate`).
 */
export type AuthoredStep = { readonly kind: string };

/**
 * A cast precondition as data (05 §5); one `AbilityRestriction` class per `kind`. The other kinds
 * of 05 §5 join with their first use.
 */
export type AbilityRestrictionSpec = { readonly kind: 'min-level'; readonly level: number };

/** What every ability has, authored or loaded. */
export type AbilityBase = {
  /** Kebab-case content id (`blade-runner`); never renamed once a save or a release stores it. */
  readonly id: string;
  readonly displayName: string;
  /** One or two plain sentences for the kit rows and the HUD. */
  readonly description: string;
  /** The Legend class whose pool may hold it (abilities are class-specific, 06). */
  readonly classId: string;
  readonly slot: AbilitySlotKind;
  /** 0 for an ultimate: the meter gates it (DEC-202). */
  readonly aetherCost: number;
  /** How the cast aims; `null` while the ability has no effects (not built yet). */
  readonly targeting: AbilityTargeting | null;
  readonly restrictions: readonly AbilityRestrictionSpec[];
  /** Per-level growth of a spec field, e.g. `{ amount: { perLevel: 0.04 } }` (05 §2, §13). */
  readonly scaling: Readonly<Record<string, { readonly perLevel: number }>>;
};

/** An ability as authored whose effect steps are `Step`: times in seconds. */
export type AuthoredAbilityWith<Step extends AuthoredStep> = AbilityBase & {
  /** 0 for an ultimate: the meter gates it (DEC-202). */
  readonly cooldownSeconds: number;
  readonly effects: readonly Step[];
};

/**
 * An ability as authored in `content/abilities/<camelId>.ts`: times in seconds. `effects: []`
 * marks an ability that is in a kit but not built yet; it cannot be cast (`unavailable`).
 */
export type AuthoredAbility = AuthoredAbilityWith<AuthoredEffectSpec>;

/** A loaded ability whose effect steps are `Step`: times in ticks. */
export type AbilityDefinitionWith<Step> = AbilityBase & {
  readonly cooldownTicks: number;
  readonly effects: readonly Step[];
};

/**
 * One loaded ability (05 §2): times in ticks. Shared, immutable and keyed by `id`; built only by
 * `loadAbilities`.
 */
export type AbilityDefinition = AbilityDefinitionWith<AbilityEffectSpec>;

/**
 * The abilities a Legend equips (DEC-198): three abilities for `ability-1` to `ability-3`, in
 * order, and the ultimate for `ability-4`. Every id comes from the class's `abilityPool`
 * (`KitInPoolRule`). The ability half of 05 §12's `Loadout`, with no varieties yet.
 */
export type AbilityKit = {
  readonly abilities: readonly [string, string, string];
  readonly ultimate: string;
};
