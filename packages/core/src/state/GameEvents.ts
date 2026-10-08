import { RingBuffer } from '../utils/RingBuffer';
import { RECENT_EVENT_CAPACITY } from './GameEvents.constants';
import type {
  GameEventHandler,
  GameEventMap,
  GameEventType,
  TimedEvent,
  Unsubscribe,
} from './GameEvents.types';

/**
 * The typed, synchronous event channel of a match. Handlers run during `emit`, in subscription
 * order; a handler added or removed during an emit takes effect from the next emit. The last
 * events are kept in a ring buffer for diagnostic reports.
 */
export class GameEvents {
  private readonly handlers = new Map<GameEventType, readonly GameEventHandler<never>[]>();
  private readonly recent = new RingBuffer<TimedEvent>(RECENT_EVENT_CAPACITY);

  /** @param currentTick - Reads the tick that recorded events are stamped with. */
  public constructor(private readonly currentTick: () => number) {}

  /** Subscribes `handler` to `type`; returns the function that unsubscribes it. */
  public on<K extends GameEventType>(type: K, handler: GameEventHandler<K>): Unsubscribe {
    this.handlers.set(type, [...this.handlersOf(type), handler]);
    return () => {
      this.off(type, handler);
    };
  }

  /** Unsubscribes `handler` from `type`; unknown handlers are ignored. */
  public off<K extends GameEventType>(type: K, handler: GameEventHandler<K>): void {
    this.handlers.set(
      type,
      this.handlersOf(type).filter((listener) => listener !== handler),
    );
  }

  /** Records the event and delivers `payload` to every handler of `type`, synchronously. */
  public emit<K extends GameEventType>(type: K, payload: GameEventMap[K]): void {
    // Safe: `payload` is typed by `type`, which is what makes a TimedEvent.
    this.recent.push({ tick: this.currentTick(), type, payload } as TimedEvent);
    for (const handler of this.handlersOf(type)) {
      handler(payload);
    }
  }

  /** The most recent events, oldest first. */
  public recentEvents(): readonly TimedEvent[] {
    return this.recent.toArray();
  }

  private handlersOf<K extends GameEventType>(type: K): readonly GameEventHandler<K>[] {
    // Safe: on() stores every handler under the type it was typed for.
    return (this.handlers.get(type) ?? []) as readonly GameEventHandler<K>[];
  }
}
