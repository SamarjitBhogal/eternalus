/**
 * A synchronous publish/subscribe bus typed by an event map (`{ name: payload }`). Handlers run in
 * subscription order; unsubscribing during an emit is safe.
 */
export class TypedEventBus<TEvents extends Record<string, unknown>> {
  private readonly handlers: { [K in keyof TEvents]?: Set<(payload: TEvents[K]) => void> } = {};

  /**
   * Subscribes to one event.
   * @returns A function that removes this handler.
   */
  public on<K extends keyof TEvents>(type: K, handler: (payload: TEvents[K]) => void): () => void {
    const set = (this.handlers[type] ??= new Set());
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }

  /** Delivers `payload` to every current handler of `type`. */
  public emit<K extends keyof TEvents>(type: K, payload: TEvents[K]): void {
    for (const handler of [...(this.handlers[type] ?? [])]) {
      handler(payload);
    }
  }

  /** Number of live handlers across all events (owners assert 0 after `destroy()`). */
  public listenerCount(): number {
    let count = 0;
    for (const type in this.handlers) {
      count += this.handlers[type]?.size ?? 0;
    }
    return count;
  }
}
