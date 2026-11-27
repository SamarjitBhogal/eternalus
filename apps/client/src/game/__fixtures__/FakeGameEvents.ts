/**
 * Test support: stands in for `Simulation.on`. It keeps the handlers, so a test emits the events by
 * hand. Imported only by tests.
 */
import type { GameEventHandler, GameEventMap, GameEventType, Unsubscribe } from '@eternalus/core';

/** A fake `Simulation.on` that records its handlers and counts the unsubscribe calls. */
export class FakeGameEvents {
  public readonly handlers: { [K in GameEventType]?: GameEventHandler<K>[] } = {};

  public unsubscribed = 0;

  /** Keeps `handler` for `type`; the returned function counts one unsubscribe. */
  public readonly on = <K extends GameEventType>(
    type: K,
    handler: GameEventHandler<K>,
  ): Unsubscribe => {
    const list: GameEventHandler<K>[] = this.handlers[type] ?? [];
    list.push(handler);
    this.handlers[type] = list as (typeof this.handlers)[K];
    return () => {
      this.unsubscribed += 1;
    };
  };

  /** Calls every handler kept for `type` with `payload`. */
  public emit<K extends GameEventType>(type: K, payload: GameEventMap[K]): void {
    for (const handler of this.handlers[type] ?? []) {
      handler(payload);
    }
  }
}
