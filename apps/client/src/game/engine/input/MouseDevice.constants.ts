/** `PointerEvent.button` of the primary (usually left) button. */
export const PRIMARY_BUTTON = 0;

/** The pointer events that update the held buttons and the pointer. */
export const POINTER_EVENTS = ['pointerdown', 'pointerup', 'pointermove', 'pointerleave'] as const;

/** Browser behaviours cancelled on the canvas: the context menu and middle-click new tabs. */
export const SUPPRESSED_EVENTS = ['contextmenu', 'auxclick'] as const;
