/** The part of `window` the guard needs. */
type UnloadTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/**
 * Asks the browser to confirm before the tab closes or reloads while an online Duel is in
 * progress (its native "Leave site?" prompt; the page cannot set the text). Leaving that way drops
 * the connection, which the server counts as abandoning the match.
 */
export class DuelUnloadGuard {
  private isArmed = false;

  public constructor(private readonly target: UnloadTarget) {}

  /** Starts asking for confirmation; safe twice. */
  public arm(): void {
    if (this.isArmed) return;
    this.isArmed = true;
    this.target.addEventListener('beforeunload', DuelUnloadGuard.onBeforeUnload);
  }

  /** Stops asking; safe twice. */
  public disarm(): void {
    if (!this.isArmed) return;
    this.isArmed = false;
    this.target.removeEventListener('beforeunload', DuelUnloadGuard.onBeforeUnload);
  }

  private static readonly onBeforeUnload = (event: Event): void => {
    event.preventDefault();
  };
}
