import type { StatusEffectDefinition } from '../content/status-effects/statusEffects.types';

/**
 * One active status on one entity (architecture 05 section 8). `StatusEffects` keeps and reuses
 * them, so a status applied every few ticks allocates nothing after the first time.
 *
 * Lives in `components/`, not `combat/` as 02 sketches, because `StatusEffects` holds it and
 * `components/` may not import `combat/`. Ids are plain strings (`components/` may not import
 * `state/`, 02 section 2).
 */
export class StatusEffectRuntime {
  /** Who applied it last (credited for its damage); `null` for the environment. */
  public sourceId: string | null = null;

  public stacks = 0;

  /** The tick it was first applied; periodic ticks count from here, so reapplying keeps the rhythm. */
  public periodAnchorTick = 0;

  /** The tick it is removed on; `null` lasts until removed. */
  public expiresTick: number | null = null;

  /** Ticks between periodic ticks; `null` when not periodic. */
  public periodTicks: number | null = null;

  /** @param definition - The status this is an instance of; `start` sets it again on reuse. */
  public constructor(public definition: StatusEffectDefinition) {}

  /**
   * (Re)starts this instance as a fresh application of `definition` (loaded, in ticks) at `tick`.
   *
   * @param durationTicks - This application's own duration (a source's override, e.g. Blade
   *   Runner's 0.5 s stun); the definition's `durationTicks` when omitted.
   */
  public start(
    definition: StatusEffectDefinition,
    sourceId: string | null,
    tick: number,
    durationTicks?: number,
  ): this {
    this.definition = definition;
    this.sourceId = sourceId;
    this.stacks = 1;
    this.periodAnchorTick = tick;
    this.periodTicks = definition.periodic?.everyTicks ?? null;
    this.expiresTick = this.expiryOf(tick, durationTicks);
    return this;
  }

  /**
   * The same status applied again while active: the one switch over stacking modes. The timer
   * runs to the later of its current expiry and this application's (`durationTicks`, else the
   * definition's), so a reapplication never shortens the time left: a 0.5 s stun on a target with
   * 2 s of stun left leaves 2 s, on one with 0.2 s left gives 0.5 s.
   */
  public reapply(sourceId: string | null, tick: number, durationTicks?: number): void {
    const { stacking, maxStacks } = this.definition;
    this.sourceId = sourceId;
    switch (stacking) {
      case 'refresh':
        break;
      case 'intensity':
        this.stacks = Math.min(maxStacks, this.stacks + 1);
        break;
    }
    const next = this.expiryOf(tick, durationTicks);
    this.expiresTick =
      this.expiresTick === null || next === null ? null : Math.max(this.expiresTick, next);
  }

  /** Whether `tick` is one of its periodic ticks (never the tick it was applied on). */
  public isPeriodicTick(tick: number): boolean {
    return (
      this.periodTicks !== null &&
      tick > this.periodAnchorTick &&
      (tick - this.periodAnchorTick) % this.periodTicks === 0
    );
  }

  /** Whether it is over at `tick`. */
  public hasExpired(tick: number): boolean {
    return this.expiresTick !== null && tick >= this.expiresTick;
  }

  /** When an application at `tick` lasting `override` (else the definition's time) ends; `null` never. */
  private expiryOf(tick: number, override: number | undefined): number | null {
    const durationTicks = override ?? this.definition.durationTicks;
    return durationTicks === null ? null : tick + durationTicks;
  }
}
