/** Keys whose browser behaviour is never cancelled, even when bound (architecture 09 §2). */
export const NEVER_PREVENTED_CODES: ReadonlySet<string> = new Set(['Tab', 'F5', 'F12']);
