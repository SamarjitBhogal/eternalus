/**
 * Test double for `window` and `document` (02 §8): a real `EventTarget` that counts its
 * listeners, with the fields `MatchHost` reads (`devicePixelRatio`, `hidden`) and a fake
 * animation-frame queue whose pending frames a test can count and run, so a test can assert
 * "0 listeners, 0 frames" (13 §2) without a browser. Listeners are counted by identity per type;
 * the capture flag is ignored (no caller uses it).
 */
export class FakeBrowserTarget extends EventTarget {
  /** `window.devicePixelRatio`. */
  public devicePixelRatio = 1;

  /** `document.hidden`. */
  public hidden = false;

  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  private readonly frames = new Map<number, FrameRequestCallback>();

  private lastFrameHandle = 0;

  /** Adds the listener, as `EventTarget` does, and counts it (the same listener once). */
  public override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    if (listener !== null) {
      this.listeners.set(type, (this.listeners.get(type) ?? new Set()).add(listener));
    }
    super.addEventListener(type, listener, options);
  }

  /** Removes the listener, as `EventTarget` does, and stops counting it. */
  public override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {
    if (listener !== null) {
      this.listeners.get(type)?.delete(listener);
    }
    super.removeEventListener(type, listener, options);
  }

  /** How many listeners are attached for `type`, or for every type when it is omitted. */
  public listenerCount(type?: string): number {
    if (type !== undefined) {
      return this.listeners.get(type)?.size ?? 0;
    }
    return [...this.listeners.values()].reduce((total, set) => total + set.size, 0);
  }

  /** `window.requestAnimationFrame`: queues `callback` until `runFrame`. */
  public requestAnimationFrame(callback: FrameRequestCallback): number {
    this.lastFrameHandle += 1;
    this.frames.set(this.lastFrameHandle, callback);
    return this.lastFrameHandle;
  }

  /** `window.cancelAnimationFrame`: drops a queued frame; unknown handles are ignored. */
  public cancelAnimationFrame(handle: number): void {
    this.frames.delete(handle);
  }

  /** How many requested frames have neither run nor been cancelled. */
  public get pendingFrames(): number {
    return this.frames.size;
  }

  /** Runs every frame queued so far with `timestampMs`; frames they request wait for the next call. */
  public runFrame(timestampMs: number): void {
    const due = [...this.frames.values()];
    this.frames.clear();
    for (const callback of due) {
      callback(timestampMs);
    }
  }
}
