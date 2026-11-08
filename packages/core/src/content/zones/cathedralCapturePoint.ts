import type { ZoneDefinition } from './zones.types';

/** The middle lane's capture point inside the Cathedral: the major capture zone (game doc). */
export const CATHEDRAL_CAPTURE_POINT: ZoneDefinition = {
  id: 'cathedral-capture-point',
  kind: 'capture-point',
  displayName: 'Cathedral',
  minimapGlyph: { shape: 'diamond', size: 8, colourRole: 'objective' },
};
