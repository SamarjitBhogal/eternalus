import type { StatusEffectDefinition } from '../content/status-effects/statusEffects.types';
import type { EntityId } from '../state/EntityStore.types';

/**
 * One active status on one entity (architecture 05 section 8). `StatusEffects` keeps and reuses
 * them, so a status applied every few ticks allocates nothing after the first time.
 *
 * Lives in `components/`, not `combat/` as 02 sketches, because `StatusEffects` holds it and
 * `components/` may not import `combat/`.
 */
export class StatusEffectRuntime {
  /** Who applied it last (credited for its damage); `null` for the environment. */
  public sourceId: EntityId | null = null;

  public stacks = 0;

  /** The tick it was first applied; periodic ticks count from here, so reapplying keeps the rhythm. */
  public periodAnchorTick = 0;

  /** The tick it is removed on; `null` lasts until removed. */
  public expiresTick: number | null = null;

  /** Ticks between periodic ticks; `null` when not periodic. */
  public periodTicks: number | null = null;

  /** @param definition - The status this is an instance of; `start` sets it again on reuse. */
  public constructor(public definition: StatusEffectDefinition) {}

  /** (Re)starts this instance as a fresh application of `definition` (loaded, in ticks) at `tick`. */
  public start(definition: StatusEffectDefinition, sourceId: EntityId | null, tick: number): this {
    this.definition = definition;
    this.sourceId = sourceId;
    this.stacks = 1;
    this.periodAnchorTick = tick;
    this.periodTicks = definition.periodic?.every ?? null;
    this.restartTimer(tick);
    return this;
  }

  /** The same status applied again while active: the one switch over stacking modes. */
  public reapply(sourceId: EntityId | null, tick: number): void {
    const { stacking, maxStacks } = this.definition;
    this.sourceId = sourceId;
    switch (stacking) {
      case 'refresh':
        break;
      case 'intensity':
        this.stacks = Math.min(maxStacks, this.stacks + 1);
        break;
    }
    this.restartTimer(tick);
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

  private restartTimer(tick: number): void {
    const { duration } = this.definition;
    this.expiresTick = duration === null ? null : tick + duration;
  }
}
