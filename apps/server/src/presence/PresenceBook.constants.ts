/** The most guests held at once: a client cannot park seats by looping connect, join, drop. */
export const MAX_HELD_GUESTS = 100; // TUNE: a fifth of MAX_CONNECTIONS

/**
 * How many gone rated guests (a finished match, connection closed, no seat or slot held) keep
 * their id and rating, so a returning player is rated again; beyond it the oldest is forgotten. A memory bound, not a rule.
 */
export const MAX_KNOWN_GUESTS = 10_000; // TUNE: a few MB of records at most
