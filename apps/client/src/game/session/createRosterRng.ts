import { SeededRandom } from '@eternalus/core';

/**
 * The match seed's random stream the bots' Legends are drawn from at LOCK IN (`SeededRandom.fork`),
 * apart from the team draw's, so the two draws never correlate.
 */
const ROSTER_RNG_STREAM = 'roster';

/**
 * `SessionControllerDeps.createRosterRng`: the stream LOCK IN draws the bots' Legends from
 * (`fillRosters`).
 * @param seed - The match seed.
 * @returns The seed's own roster stream.
 */
export function createRosterRng(seed: number): SeededRandom {
  return new SeededRandom(seed).fork(ROSTER_RNG_STREAM);
}
