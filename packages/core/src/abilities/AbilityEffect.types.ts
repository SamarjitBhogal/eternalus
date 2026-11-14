import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { Aim } from '../components/AbilitySlotRuntime.types';
import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../content/loadDisplayContent';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import type { ShapePlacement, ShapeSpec } from './shapes/AreaShape.types';
import type { TargetFilter } from './TargetQuery.types';

/**
 * The part of an effect step the registry reads: its kind, the key of its `AbilityEffect`. The
 * shipped steps are `content/abilities`' `AbilityEffectSpec` union; each strategy narrows to its own.
 */
export type EffectStep = { readonly kind: string };

/**
 * What an effect sees while it runs (05 §3 `CastContext`), built once per cast by `CastInstance`.
 * Effects change components through the pipeline and the applier given here, never by calling
 * each other or a system (rule 12).
 */
export type CastContext = {
  readonly casterId: EntityId;
  readonly abilityId: string;
  readonly slot: AbilitySlot;
  /** The tick of the cast. */
  readonly tick: number;
  readonly state: GameState;
  readonly aim: Aim;
  /** Unit vector from the caster toward `aim.point`; `{ 0, 0 }` when the aim is on the caster. */
  readonly direction: Vec2;
  /** Where this step's shapes sit: on the caster for the cast's own steps. */
  readonly placement: ShapePlacement;
  /**
   * `value`, the spec field `field` of a step, grown by the ability's per-level `scaling` of that
   * field: `value × (1 + perLevel × (casterLevel − 1))` (`balancing.md`: +4% potency per level,
   * so level 1 is the content value). A field the ability does not scale comes back unchanged.
   */
  scaled(field: string, value: number): number;
  /** The match's one damage pipeline. */
  readonly damage: DamagePipeline;
  /** The match's one status applier. */
  readonly statuses: StatusEffectApplier;
  /** Every live entity that overlaps `shape` at this step's placement and passes `filter`, by id. */
  targets(shape: ShapeSpec, filter: TargetFilter): readonly EntityId[];
  /** The point of `shape` at this step's placement that a push at `point` moves away from. */
  centreFor(shape: ShapeSpec, point: Vec2): Vec2;
  /** Runs a nested step (a dash's `onPath` or `onEnd`) through the registry at `placement`. */
  run(step: EffectStep, placement: ShapePlacement): void;
};

/** The overlay rows of one nested step (a dash's `onPath` and `onEnd`), from its own strategy. */
export type NestedDescriber = (step: EffectStep) => readonly AbilityDisplayStep[];

/**
 * One kind of effect (05 §3): a stateless Flyweight, one instance per kind in the
 * `AbilityRegistry`. A new kind is one class and one `defaultAbilityRegistry.ts` line: the loader
 * and the display content know no kind, so the class checks and describes its own spec.
 */
export interface AbilityEffect<S extends EffectStep = EffectStep> {
  /** The registry key, e.g. `knockback`. */
  readonly kind: S['kind'];
  /**
   * What is wrong with the step's own fields, or nothing (05 §3 `validate`; "a typo fails at
   * boot"). The registry checks the step's shape and nested steps with their own strategies and
   * runs this for every ability in `resolveAll`, at boot.
   */
  validate(spec: S): readonly string[];
  /**
   * The rows the aim overlay draws for the step (`AbilityDisplay.steps`, 05 §15): its own area and,
   * through `nested`, those of the steps it runs. It reads only areas, distances and nested steps,
   * which loading leaves as authored, so it describes an authored step too.
   */
  describe(spec: S, nested: NestedDescriber): readonly AbilityDisplayStep[];
  /** Applies `spec` for the cast described by `cast`, this tick. */
  apply(spec: S, cast: CastContext): void;
}
