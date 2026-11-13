/** Rating gap two players may have the moment they join. */
export const BASE_RATING_GAP = 100; // TUNE: about one standard deviation of a settled Duel rating

/** How much the allowed gap grows for each second someone waits. */
export const GAP_WIDENING_PER_SECOND = 25; // TUNE: a 300 gap pairs after 8 s

/** After this wait a player pairs with their closest rating, whatever the gap: nobody waits forever. */
export const QUEUE_TIMEOUT_MS = 30_000; // TUNE: the longest a player waits while others are queued

/** How often the queue re-checks its waiters, as the allowed gaps grow with time. */
export const QUEUE_SWEEP_MS = 1000; // TUNE: finer than the widening, coarse enough to be free
