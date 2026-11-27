/** Keys whose browser default is never prevented, even when bound: focus moves, reload, devtools. */
export const NEVER_PREVENTED_CODES: readonly string[] = ['Tab', 'F5', 'F12'];

/** Window events after which no `keyup` arrives for keys still held. */
export const FOCUS_LOSS_EVENTS: readonly string[] = ['blur', 'visibilitychange'];

/**
 * Matches an open modal dialog. A key pressed inside one belongs to its controls (Space and Enter
 * press the focused button), never to the bindings.
 */
export const MODAL_SELECTOR = '[aria-modal="true"]';
