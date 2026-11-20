// Source of the three starting values: Mark E. Glickman, "Example of the Glicko-2 system",
// step 1: an unrated player starts at rating 1500 and deviation 350; the volatility 0.06 is the
// value his example uses (he notes it depends on the application).

/** The rating a new player starts with (Glickman, step 1). */
export const DEFAULT_RATING = 1500;

/** The rating deviation (uncertainty) a new player starts with (Glickman, step 1). */
export const DEFAULT_DEVIATION = 350;

/** The volatility a new player starts with (Glickman, step 1). */
export const DEFAULT_VOLATILITY = 0.06;

/** The system constant: how fast volatility may change; smaller means steadier ratings. */
export const SYSTEM_TAU = 0.5; // TUNE: Glickman suggests 0.3 to 1.2; 0.5 is his worked example

/** Converts between the Glicko rating scale and the internal Glicko-2 scale (400 / ln 10). */
export const SCALE = 173.7178;

/** Cap on each volatility loop, so a degenerate input cannot hang the server. */
export const MAX_ITERATIONS = 100;

/** The volatility iteration stops when two guesses differ by less than this. */
export const CONVERGENCE_EPSILON = 0.000001;
