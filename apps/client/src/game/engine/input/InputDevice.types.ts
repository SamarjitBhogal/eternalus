/**
 * What the input devices report for one frame (architecture 09 §2). Only the keyboard fields exist
 * so far; the mouse adds its buttons and pointer when `MouseDevice` lands.
 */
export type InputSnapshot = {
  /** `KeyboardEvent.code` of every key held. */
  readonly keys: ReadonlySet<string>;
  /** `KeyboardEvent.key` seen when each held key went down, for prompts. */
  readonly keyLabels: ReadonlyMap<string, string>;
};

/** The snapshot devices write into; one per frame, shared by every device. */
export type MutableInputSnapshot = {
  readonly keys: Set<string>;
  readonly keyLabels: Map<string, string>;
};

/**
 * One input device (keyboard, mouse, gamepad) behind a port, so the game never touches a
 * browser event (architecture 09 §1). Devices expose state only, never commands.
 */
export interface InputDevice {
  /** Starts listening to `target`'s events. */
  attach(target: EventTarget): void;
  /** Stops listening; the device reports nothing new afterwards. */
  detach(): void;
  /** Adds what is held now to `snapshot`, keeping what other devices wrote. */
  writeInto(snapshot: MutableInputSnapshot): void;
  /** Forgets everything held, for when the window loses focus and no release will arrive. */
  releaseAll(): void;
}
