/**
 * A `Simulation` records a replay checkpoint, `hash()` after that many completed ticks, every this
 * many ticks (ADR 0025 §4). `runReplay` needs one to advance and checks the replay against it.
 */
export const REPLAY_CHECKPOINT_EVERY = 300; // TUNE: 10 s at 30 ticks/s
