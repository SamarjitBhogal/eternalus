/** Numerical separation, not a gameplay distance: prevents repeated contact from roundoff. */
export const CONTACT_EPSILON = 1e-7;
/** Enough contacts for sliding into a corner; remaining displacement is discarded safely. */
export const MAX_SLIDE_CONTACTS = 4;
