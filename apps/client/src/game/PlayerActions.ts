import type { EntityId, Snapshot, Vec2 } from '@eternalus/core';

/** The parts of a snapshot an attack target is picked from: its units and map objects. */
type TargetSnapshot = Pick<Snapshot, 'entities' | 'mapObjects'>;

/**
 * What the player's input does to their Legend, once a tick (`Match.tick`) and on the developer
 * explorer's clicks. Two implementations: `PlayerCommands` turns it into commands for the local
 * simulation; `RemoteIntentSender` sends the raw intent to the Duel server (ADR 0016 point 1).
 */
export interface PlayerActions {
  /** Whether the canvas gestures own the main button's press (a minimap click, the explorer). */
  setPointerClaimed(isClaimed: boolean): void;
  /**
   * Reads this tick's intent and acts on it for the Legend `actorId`; `snapshot` is the latest one.
   * @returns Whether the player's movement input is non-zero this tick.
   */
  apply(actorId: EntityId, snapshot: TargetSnapshot): boolean;
  /** The developer explorer's click on a unit; whether one was under `point`. */
  attackUnitAt(actorId: EntityId, point: Vec2, snapshot: TargetSnapshot): boolean;
  /** The developer explorer's click on a map object. */
  attackObjectAt(actorId: EntityId, point: Vec2, snapshot: TargetSnapshot): void;
}
