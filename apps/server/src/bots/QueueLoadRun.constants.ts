/** How often the run samples the queue size and checks whether it has settled, in milliseconds. */
export const QUEUE_POLL_MS = 50; // TUNE: finer than the time-to-match numbers it reports

/** Polls in a row with nothing left to pair before the run ends early. */
export const SETTLE_POLLS = 3;
