import type { ZoneDefinition } from './zones.types';

/** The middle lane's capture point inside the Cathedral: the major capture zone (game doc). */
export const CATHEDRAL_CAPTURE_POINT: ZoneDefinition = {
  id: 'cathedral-capture-point',
  kind: 'capture-point',
  displayName: 'Cathedral',
  radius: 35, // TUNE: the Cathedral's capture court (PR #30: radius 35 around the anchor)
  minimapGlyph: { shape: 'ring', size: 8, colourRole: 'objective' },
};
