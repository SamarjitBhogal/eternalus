/** Keys whose browser default is never prevented, even when bound: focus moves, reload, devtools. */
export const NEVER_PREVENTED_CODES: readonly string[] = ['Tab', 'F5', 'F12'];

/** Window events after which no `keyup` arrives for keys still held. */
export const FOCUS_LOSS_EVENTS: readonly string[] = ['blur', 'visibilitychange'];
