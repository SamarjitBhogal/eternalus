import type { ZoneDefinition } from './zones.types';

/** An outer-lane capture point: the lesser capture zones of the game doc (`05-map.md`). */
export const CAPTURE_POINT: ZoneDefinition = {
  id: 'capture-point',
  kind: 'capture-point',
  displayName: 'Capture Point',
  minimapGlyph: { shape: 'ring', size: 5, colourRole: 'objective' },
};
