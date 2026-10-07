/** `MouseEvent.button` of the main (usually left) button. */
export const MAIN_BUTTON = 0;

/**
 * `PointerEvent.buttons` bits and the `MouseEvent.button` each stands for. The two numberings
 * differ: bit 2 is the secondary button (2) and bit 4 the wheel button (1).
 */
export const BUTTON_BITS: readonly (readonly [bit: number, button: number])[] = [
  [1, 0],
  [4, 1],
  [2, 2],
  [8, 3],
  [16, 4],
];

/** Pointer events that carry the current button state and position. */
export const POINTER_EVENTS: readonly string[] = ['pointerdown', 'pointerup', 'pointermove'];

/** Browser actions a game button must not trigger: the context menu, middle-click new tab. */
export const SUPPRESSED_EVENTS: readonly string[] = ['contextmenu', 'auxclick'];
