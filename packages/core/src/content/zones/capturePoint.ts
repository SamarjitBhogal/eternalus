import type { ZoneDefinition } from './zones.types';

/** An outer-lane capture point: the lesser capture zones of the game doc (`05-map.md`). */
export const CAPTURE_POINT: ZoneDefinition = {
  id: 'capture-point',
  kind: 'capture-point',
  displayName: 'Capture Point',
  minimapGlyph: { shape: 'ring', size: 5, colourRole: 'objective' },
  // TUNE: balancing.md `Recommendation:` "after 90 s of continuous ownership, friendly minions
  // spawned on that lane get +1 minion level (max 3)", approved by DEC-258 (every capture point).
  levelUp: { holdSeconds: 90, levels: 1 },
};
