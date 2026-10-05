import type { MapFeatureDefinition } from './maps.types';

/**
 * Every kind of thing the map generator can place, keyed by content id. Footprints are in world
 * units, minimap glyph sizes in minimap pixels.
 *
 * TUNE: all sizes are provisional placeholders until structure content lands (Phase 2).
 */
export const MAP_FEATURE_DEFINITIONS: Readonly<Record<string, MapFeatureDefinition>> = {
  stronghold: {
    id: 'stronghold',
    kind: 'stronghold',
    minimapGlyph: { shape: 'square', size: 8, colourRole: 'team' },
    footprintRadius: 40,
    blocksMovement: true,
  },
  'spawner-tower': {
    id: 'spawner-tower',
    kind: 'spawner-tower',
    minimapGlyph: { shape: 'square', size: 5, colourRole: 'team' },
    footprintRadius: 14,
    blocksMovement: true,
  },
  'buff-tower': {
    id: 'buff-tower',
    kind: 'buff-tower',
    minimapGlyph: { shape: 'diamond', size: 5, colourRole: 'team' },
    footprintRadius: 14,
    blocksMovement: true,
  },
  'wall-segment': {
    id: 'wall-segment',
    kind: 'wall-segment',
    minimapGlyph: { shape: 'square', size: 2, colourRole: 'team' },
    footprintRadius: 0, // the generator gives each segment its own polygon
    blocksMovement: true,
  },
  gate: {
    id: 'gate',
    kind: 'gate',
    minimapGlyph: { shape: 'square', size: 3, colourRole: 'team' },
    footprintRadius: 0, // the generator gives each gate its own polygon
    blocksMovement: false, // open for the MVP; per-team gate passage is Phase 2
  },
  turret: {
    id: 'turret',
    kind: 'turret',
    minimapGlyph: { shape: 'dot', size: 3, colourRole: 'team' },
    footprintRadius: 8,
    blocksMovement: true,
  },
  'forest-camp-light': {
    id: 'forest-camp-light',
    kind: 'camp',
    minimapGlyph: { shape: 'dot', size: 3, colourRole: 'neutral' },
    footprintRadius: 0,
    blocksMovement: false,
  },
  'forest-camp-medium': {
    id: 'forest-camp-medium',
    kind: 'camp',
    minimapGlyph: { shape: 'dot', size: 4, colourRole: 'neutral' },
    footprintRadius: 0,
    blocksMovement: false,
  },
  'forest-camp-heavy': {
    id: 'forest-camp-heavy',
    kind: 'camp',
    minimapGlyph: { shape: 'dot', size: 5, colourRole: 'neutral' },
    footprintRadius: 0,
    blocksMovement: false,
  },
  'corner-camp': {
    id: 'corner-camp',
    kind: 'corner-camp',
    minimapGlyph: { shape: 'ring', size: 5, colourRole: 'objective' },
    footprintRadius: 0,
    blocksMovement: false,
  },
  'capture-point': {
    id: 'capture-point',
    kind: 'capture-point',
    minimapGlyph: { shape: 'ring', size: 5, colourRole: 'objective' },
    footprintRadius: 0,
    blocksMovement: false,
  },
  cathedral: {
    id: 'cathedral',
    kind: 'cathedral',
    minimapGlyph: { shape: 'diamond', size: 8, colourRole: 'objective' },
    footprintRadius: 0,
    blocksMovement: false,
  },
  'bridge-segment': {
    id: 'bridge-segment',
    kind: 'obstacle',
    minimapGlyph: { shape: 'square', size: 3, colourRole: 'terrain' },
    footprintRadius: 0,
    blocksMovement: false,
  },
  tree: {
    id: 'tree',
    kind: 'obstacle',
    minimapGlyph: { shape: 'dot', size: 2, colourRole: 'obstacle' },
    footprintRadius: 8,
    blocksMovement: true,
  },
  rock: {
    id: 'rock',
    kind: 'obstacle',
    minimapGlyph: { shape: 'dot', size: 2, colourRole: 'obstacle' },
    footprintRadius: 10,
    blocksMovement: true,
  },
};
