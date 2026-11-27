import type { ZoneDefinition } from './zones.types';

/** The middle lane's capture point inside the Cathedral: the major capture zone (game doc). */
export const CATHEDRAL_CAPTURE_POINT: ZoneDefinition = {
  id: 'cathedral-capture-point',
  kind: 'capture-point',
  displayName: 'Cathedral',
  minimapGlyph: { shape: 'diamond', size: 8, colourRole: 'objective' },
  // TUNE: balancing.md `Recommendation:` "after 90 s of continuous ownership, friendly minions
  // spawned on that lane get +1 minion level (max 3)", approved by DEC-258 (every capture point).
  levelUp: { holdSeconds: 90, levels: 1 },
};
