/** Chooses a fresh unsigned match seed at the browser boundary, before deterministic generation. */
export function createMatchSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}
