import type { Snapshot, Unsubscribe } from '@eternalus/core';

import type { MatchSimulation } from '../Match.types';
import type { DuelLink } from './DuelLink.types';

/**
 * The `Match`'s stand-in for core's `Simulation` online (ADR 0016 point 1): the server steps the
 * world, so a "step" here only adopts the newest snapshot received. `Match` keeps the last two for
 * drawing, as it does locally.
 * ponytail: no interpolation between server snapshots and no prediction of the player's own Legend;
 * add both only if the netcode spike asks for them (ADR 0016 point 1).
 */
export class RemoteSimulation implements MatchSimulation {
  private static readonly NO_LISTENER: Unsubscribe = () => undefined;

  private current: Snapshot;

  /** Starts on the snapshot that started the Duel. */
  public constructor(
    private readonly link: DuelLink,
    initial: Snapshot,
  ) {
    this.current = initial;
  }

  /** The tick of the newest snapshot adopted. */
  public get tick(): number {
    return this.current.tick;
  }

  /** Adopts the newest snapshot the server sent. */
  public step(): void {
    this.current = this.link.latestSnapshot();
  }

  /** The newest snapshot adopted. */
  public snapshot(): Snapshot {
    return this.current;
  }

  /**
   * Does nothing: the server turns intents into commands, and no client command travels
   * (dev commands included, ADR 0016 point 7). `Match` never calls it online.
   */
  public enqueueCommand(): void {
    return undefined;
  }

  /**
   * No game events reach the client online: the server sends snapshots only (ADR 0016 point 1), so
   * listeners never fire. ponytail: health bars stay hidden in a Duel; send the tick's events (or
   * derive hits from health changes) when the Duel needs them.
   */
  public on(): Unsubscribe {
    return RemoteSimulation.NO_LISTENER;
  }
}
