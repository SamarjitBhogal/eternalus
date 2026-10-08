/** `PointerEvent.button` of the primary (usually left) button. */
export const PRIMARY_BUTTON = 0;

/** `PointerEvent.buttons` bit of the primary button. */
export const PRIMARY_BUTTON_BIT = 1;

/** The pointer events that update the held buttons and the pointer. */
export const POINTER_EVENTS = [
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointercancel',
  'pointerleave',
] as const;

/** Browser behaviours cancelled on the canvas: the context menu and middle-click new tabs. */
export const SUPPRESSED_EVENTS = ['contextmenu', 'auxclick'] as const;
