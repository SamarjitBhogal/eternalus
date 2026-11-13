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
 * for the reconnect window: a connection that presents the same id inside it takes the slot over;
 * after it the guest leaves the queue or forfeits. The ids are bearer tokens: never log them.
 */
export class PresenceBook {
  private readonly byConnection = new Map<ClientConnection, Guest>();
  private readonly byId = new Map<string, Guest>();

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
    const rival = this.options.host.rivalOf(connection);
    const other = rival === null ? undefined : this.byConnection.get(rival);
    if (other !== undefined && !other.isConnected) {
      this.drop(guest);
      this.drop(other);
    }
  }

  /**
   * `connection` presents `guestId`: if that guest is HELD (disconnected, inside the window) and
   * `connection` is idle, `connection` becomes that guest: it gets `welcome` with the id back and
   * takes over the queue slot or seat (told `queue-waiting` or `match-found` again). The id of a
   * guest that is still connected is ignored, so nobody can kick a live player.
   * @returns Whether a queue slot or seat was taken over; `false` leaves `connection` as it was.
   */
  public resume(connection: ClientConnection, guestId: string): boolean {
    const own = this.byConnection.get(connection);
    const guest = this.byId.get(guestId);
    if (own === undefined || guest === undefined || guest.isConnected) return false;
    if (this.stateOf(own) !== 'online') return false;
    const previous = guest.connection;
    guest.cancelDrop?.();
    guest.cancelDrop = null;
    this.options.host.replace(previous, connection);
    this.options.queue.replace(previous, connection);
    this.remove(own);
    this.byConnection.delete(previous);
    guest.connection = connection;
    guest.isConnected = true;
    this.byConnection.set(connection, guest);
    connection.send({ type: 'welcome', guestId: guest.id });
    return this.stateOf(guest) !== 'online';
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

  /** Ends a guest's hold: leaves the queue, forfeits the match, forgets the guest. */
  private drop(guest: Guest): void {
    this.options.queue.leave(guest.connection);
    this.options.host.leave(guest.connection);
    this.remove(guest);
  }

  private remove(guest: Guest): void {
    guest.cancelDrop?.();
    this.byConnection.delete(guest.connection);
    this.byId.delete(guest.id);
  }
}
