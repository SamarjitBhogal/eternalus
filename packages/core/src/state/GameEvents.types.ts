import type { FeatureOwner } from '../content/maps/maps.types';
import type { EntityId, RemovalCause } from './EntityStore.types';

/**
 * Every event the simulation can emit, by name (architecture 03 §4). The single place of change
 * for events: an emitter adds its line here. Emitting a name that is not listed does not compile.
 */
export type GameEventMap = {
  readonly 'entity-spawned': {
    readonly entityId: EntityId;
    readonly kind: string;
    readonly team: FeatureOwner;
  };
  readonly 'entity-removed': { readonly entityId: EntityId; readonly cause: RemovalCause };
  /** `command` is the rejected `Command` (typed loosely: `state/` sits below `commands/`). */
  readonly 'command-rejected': {
    readonly command: { readonly type: string };
    readonly reason: string;
  };
  readonly 'tick-completed': { readonly tick: number };
};

/** The name of a game event. */
export type GameEventType = keyof GameEventMap;

/** A listener for one event type. */
export type GameEventHandler<K extends GameEventType> = (payload: GameEventMap[K]) => void;

/** Stops the subscription it was returned from. */
export type Unsubscribe = () => void;

/** An event as recorded for diagnostics: what happened, with what payload, in which tick. */
export type TimedEvent = {
  readonly [K in GameEventType]: {
    readonly tick: number;
    readonly type: K;
    readonly payload: GameEventMap[K];
  };
}[GameEventType];
