/** A point on the canvas in CSS pixels, from its top-left corner. */
export type ScreenPoint = { readonly x: number; readonly y: number };

/**
 * What the input devices report for one frame (architecture 09 §2). The wheel and gamepad fields
 * arrive with the actions and the device that need them.
 */
export type InputSnapshot = {
  /** `KeyboardEvent.code` of every key held. */
  readonly keys: ReadonlySet<string>;
  /** `KeyboardEvent.key` seen when each held key went down, for prompts. */
  readonly keyLabels: ReadonlyMap<string, string>;
  /** `PointerEvent.buttons` held: 1 left, 2 right, 4 middle, 8 back, 16 forward. */
  readonly mouseButtons: number;
  /** Where the pointer is on the canvas, or `null` when it is off the canvas. */
  readonly pointer: ScreenPoint | null;
};

/** The snapshot devices write into; one per frame, shared by every device. */
export type MutableInputSnapshot = {
  readonly keys: Set<string>;
  readonly keyLabels: Map<string, string>;
  mouseButtons: number;
  pointer: ScreenPoint | null;
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
