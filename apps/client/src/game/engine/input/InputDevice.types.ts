/** A pointer position in CSS pixels, relative to the element the device is attached to. */
export type PointerPosition = { readonly x: number; readonly y: number };

/**
 * Everything the attached devices hold right now, merged into one value. Raw device state only:
 * no game vocabulary. `game/input/InputMapper` turns it into actions through the bindings.
 */
export type InputSnapshot = {
  /** `KeyboardEvent.code` of every key held (`KeyboardEvent.key` when `code` is empty). */
  readonly keys: ReadonlySet<string>;
  /** `MouseEvent.button` of every mouse button held: 0 main, 1 wheel, 2 secondary, 3/4 side. */
  readonly mouseButtons: ReadonlySet<number>;
  /** The last pointer position, or `null` before the pointer has moved over the target. */
  readonly pointer: PointerPosition | null;
};

/** The snapshot devices write into. Each frame starts from an empty one. */
export type MutableInputSnapshot = {
  keys: Set<string>;
  mouseButtons: Set<number>;
  pointer: PointerPosition | null;
};

/**
 * The port every input adapter implements (architecture 09 §2). One adapter wraps one browser
 * API; the game depends on this interface, never on `KeyboardDevice` or `MouseDevice`.
 */
export interface InputDevice {
  /** Starts listening to `target` (the window for keys, the canvas for the pointer). */
  attach(target: EventTarget): void;
  /** Stops listening and releases everything held. Safe to call when not attached. */
  detach(): void;
  /** Adds what this device holds to `snapshot`, leaving other devices' entries alone. */
  writeInto(snapshot: MutableInputSnapshot): void;
  /** Forgets everything held, for focus loss: no release event arrives for it. */
  releaseAll(): void;
}
