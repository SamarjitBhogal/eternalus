import type { ClientConnection } from '../transport/ClientConnection.types';
import type { CancelTask } from '../time/TickScheduler.types';
import type { PresenceBookOptions, PresenceCounts, PresenceState } from './PresenceBook.types';

type Guest = {
  readonly id: string;
  connection: ClientConnection;
  isConnected: boolean;
  /** Ends the reconnect window, while one is running. */
  cancelDrop: CancelTask | null;
};

/**
 * Guest identity and presence (ADR 0016 point 5, SCRUM-430). Every connection is a guest with an
 * opaque id the server issued (`welcome`). A guest's state is read from the queue and the host,
 * never copied, so it cannot drift. When a queued or in-match guest disconnects, its slot is held
 * for the reconnect window (DEC-297 (1)): a connection that presents the same id inside it takes
 * the slot over; after it the guest leaves the queue or forfeits, a leave and a loss (DEC-250 (4)).
 * A guest with a finished match whose connection is gone (every match end closes both sockets) is remembered: a later
 * connection that presents its id becomes that guest again, with its rating. Only the newest
 * `maxKnownGuests` are remembered; the oldest is forgotten, rating and all, so memory stays
 * bounded. The ids are bearer tokens: never log them.
 */
export class PresenceBook {
  private readonly byConnection = new Map<ClientConnection, Guest>();
  private readonly byId = new Map<string, Guest>();
  /** Ids of guests whose connection is gone, oldest first (a `Set` keeps insertion order). */
  private readonly known = new Set<string>();

  public constructor(private readonly options: PresenceBookOptions) {}

  /** A new connection: issues it a guest id and sends `welcome`. */
  public connect(connection: ClientConnection): void {
    const guest: Guest = {
      id: this.options.newGuestId(),
      connection,
      isConnected: true,
      cancelDrop: null,
    };
    this.byConnection.set(connection, guest);
    this.byId.set(guest.id, guest);
    connection.send({ type: 'welcome', guestId: guest.id });
  }

  /**
   * `connection` closed: an idle guest goes at once; a queued or in-match one is held for the
   * window, unless too many guests are held already or the opponent is held too (a match with no
   * one connected ends at once).
   */
  public disconnect(connection: ClientConnection): void {
    const guest = this.byConnection.get(connection);
    if (guest === undefined) return;
    guest.isConnected = false;
    if (this.stateOf(guest) === 'online' || this.counts().held > this.options.maxHeldGuests) {
      this.drop(guest);
      return;
    }
    // ponytail: one interval per held guest (at most `maxHeldGuests`); one sweep task over a held list if that many timers hurt.
    const cancel = this.options.scheduler.every(this.options.reconnectWindowMs, () => {
      cancel();
      this.drop(guest);
    });
    guest.cancelDrop = cancel;
    this.options.queue.hold(connection);
    const rival = this.options.host.rivalOf(connection);
    const other = rival === null ? undefined : this.byConnection.get(rival);
    if (other !== undefined && !other.isConnected) {
      // The one who left first, while the other was still in the Duel, takes the loss (DEC-250 (4)).
      this.drop(other);
      this.drop(guest);
    } else {
      rival?.send({
        type: 'opponent-presence',
        status: 'disconnected',
        graceMs: this.options.reconnectWindowMs,
      });
    }
  }

  /**
   * `connection` presents `guestId` while it is idle. If that guest is HELD (disconnected, inside
   * the window), `connection` becomes that guest: it gets `welcome` with the id back, then takes
   * over the queue slot or seat (told `queue-waiting` or `match-found` again). If that guest is
   * remembered (gone, not held), `connection` becomes that guest too (`welcome` with the id back)
   * and keeps its rating, but has no slot to take over. The id of a guest that is still connected
   * is ignored, so nobody can kick a live player.
   * @returns Whether a queue slot or seat was taken over; `false` means `connection` should join.
   */
  public resume(connection: ClientConnection, guestId: string): boolean {
    const own = this.byConnection.get(connection);
    if (own === undefined || own.id === guestId || this.stateOf(own) !== 'online') return false;
    if (this.known.has(guestId)) {
      this.adopt(own, guestId);
      return false;
    }
    const guest = this.byId.get(guestId);
    if (guest === undefined || guest.isConnected) return false;
    const previous = guest.connection;
    const rival = this.options.host.rivalOf(previous);
    guest.cancelDrop?.();
    guest.cancelDrop = null;
    this.remove(own);
    this.byConnection.delete(previous);
    guest.connection = connection;
    guest.isConnected = true;
    this.byConnection.set(connection, guest);
    connection.send({ type: 'welcome', guestId: guest.id });
    this.options.host.replace(previous, connection);
    this.options.queue.replace(previous, connection);
    rival?.send({ type: 'opponent-presence', status: 'reconnected' });
    return this.stateOf(guest) !== 'online';
  }

  /** The guest id of `connection`, or `null` if it is not a guest (closed). */
  public guestIdOf(connection: ClientConnection): string | null {
    return this.byConnection.get(connection)?.id ?? null;
  }

  /** Guests per state, for tests and `/metrics`; the three states add up to the open connections. */
  public counts(): PresenceCounts {
    let online = 0;
    let queued = 0;
    let inMatch = 0;
    let held = 0;
    for (const guest of this.byId.values()) {
      const state = this.stateOf(guest);
      if (!guest.isConnected) held += 1;
      else if (state === 'queued') queued += 1;
      else if (state === 'in-match') inMatch += 1;
      else online += 1;
    }
    return { online, queued, inMatch, held };
  }

  private stateOf(guest: Guest): PresenceState {
    if (this.options.host.isInMatch(guest.connection)) return 'in-match';
    return this.options.queue.isWaiting(guest.connection) ? 'queued' : 'online';
  }

  /** Ends a guest's hold: leaves the queue, forfeits the match, remembers the guest. */
  private drop(guest: Guest): void {
    this.options.queue.leave(guest.connection);
    this.options.host.leave(guest.connection);
    this.remove(guest);
  }

  /** `own` (idle, connected) becomes the remembered guest `guestId` and is told so. */
  private adopt(own: Guest, guestId: string): void {
    this.known.delete(guestId);
    this.remove(own);
    const guest: Guest = {
      id: guestId,
      connection: own.connection,
      isConnected: true,
      cancelDrop: null,
    };
    this.byConnection.set(guest.connection, guest);
    this.byId.set(guestId, guest);
    guest.connection.send({ type: 'welcome', guestId });
  }

  /** Ends a guest's connection-bound life; its id and rating are remembered for a later connection. */
  private remove(guest: Guest): void {
    guest.cancelDrop?.();
    this.byConnection.delete(guest.connection);
    this.byId.delete(guest.id);
    this.remember(guest.id);
  }

  /** Only a guest with a finished match is remembered: an id with no rating is not worth a slot. */
  private remember(guestId: string): void {
    this.known.delete(guestId);
    if (this.options.ratings.get(guestId).matches === 0) return;
    this.known.add(guestId);
    if (this.known.size <= this.options.maxKnownGuests) return;
    for (const oldest of this.known) {
      this.known.delete(oldest);
      this.options.ratings.forget(oldest);
      return;
    }
  }
}
