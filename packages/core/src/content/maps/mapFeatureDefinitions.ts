import type { MapFeatureDefinition } from './maps.types';

/**
 * Every kind of thing the map generator can place, keyed by content id. Footprints are in world
 * units, minimap glyph sizes in minimap pixels. Display names are the HUD's (the Figma's layer
 * names, pending HC-Q4); a kind no screen names has `null`.
 *
 * TUNE: all sizes are provisional placeholders until structure content lands (Phase 2).
 */
export const MAP_FEATURE_DEFINITIONS: Readonly<Record<string, MapFeatureDefinition>> = {
  stronghold: {
    id: 'stronghold',
    kind: 'stronghold',
    minimapGlyph: { shape: 'square', size: 8, colourRole: 'team' },
    footprintRadius: 40,
    isBlocking: true,
    displayName: 'Stronghold', // names pending HC-Q4
  },
  'spawner-tower': {
    id: 'spawner-tower',
    kind: 'spawner-tower',
    minimapGlyph: { shape: 'square', size: 5, colourRole: 'team' },
    footprintRadius: 14,
    isBlocking: true,
    displayName: 'Production Tower', // names pending HC-Q4
  },
  'buff-tower': {
    id: 'buff-tower',
    kind: 'buff-tower',
    minimapGlyph: { shape: 'diamond', size: 5, colourRole: 'team' },
    footprintRadius: 14,
    isBlocking: true,
    displayName: 'Buff Tower', // names pending HC-Q4
  },
  'wall-segment': {
    id: 'wall-segment',
    kind: 'wall-segment',
    minimapGlyph: { shape: 'square', size: 2, colourRole: 'team' },
    footprintRadius: 0, // the generator gives each segment its own polygon
    isBlocking: true,
    displayName: 'Wall', // names pending HC-Q4
  },
  gate: {
    id: 'gate',
    kind: 'gate',
    minimapGlyph: { shape: 'square', size: 3, colourRole: 'team' },
    footprintRadius: 0, // the generator gives each gate its own polygon
    isBlocking: false, // open for the MVP; per-team gate passage is Phase 2
    displayName: null,
  },
  turret: {
    id: 'turret',
    kind: 'turret',
    minimapGlyph: { shape: 'dot', size: 3, colourRole: 'team' },
    footprintRadius: 8,
    isBlocking: true,
    displayName: null,
  },
  'forest-camp-light': {
    id: 'forest-camp-light',
    kind: 'camp',
    minimapGlyph: { shape: 'dot', size: 3, colourRole: 'neutral' },
    footprintRadius: 0,
    isBlocking: false,
    displayName: null,
  },
  'forest-camp-medium': {
    id: 'forest-camp-medium',
    kind: 'camp',
    minimapGlyph: { shape: 'dot', size: 4, colourRole: 'neutral' },
    footprintRadius: 0,
    isBlocking: false,
    displayName: null,
  },
  'forest-camp-heavy': {
    id: 'forest-camp-heavy',
    kind: 'camp',
    minimapGlyph: { shape: 'dot', size: 5, colourRole: 'neutral' },
    footprintRadius: 0,
    isBlocking: false,
    displayName: null,
  },
  'corner-camp': {
    id: 'corner-camp',
    kind: 'corner-camp',
    minimapGlyph: { shape: 'ring', size: 5, colourRole: 'objective' },
    footprintRadius: 0,
    isBlocking: false,
    displayName: null,
  },
  'capture-point': {
    id: 'capture-point',
    kind: 'capture-point',
    minimapGlyph: { shape: 'ring', size: 5, colourRole: 'objective' },
    footprintRadius: 0,
    isBlocking: false,
    displayName: 'Capture Point', // names pending HC-Q4
  },
  cathedral: {
    id: 'cathedral',
    kind: 'cathedral',
    minimapGlyph: { shape: 'diamond', size: 8, colourRole: 'objective' },
    footprintRadius: 0,
    isBlocking: false,
    displayName: 'Cathedral', // names pending HC-Q4
  },
  'bridge-segment': {
    id: 'bridge-segment',
    kind: 'obstacle',
    minimapGlyph: { shape: 'square', size: 3, colourRole: 'terrain' },
    footprintRadius: 0,
    isBlocking: false,
    displayName: null,
  },
  tree: {
    id: 'tree',
    kind: 'obstacle',
    minimapGlyph: { shape: 'dot', size: 2, colourRole: 'obstacle' },
    footprintRadius: 8,
    isBlocking: true,
    displayName: null,
  },
  rock: {
    id: 'rock',
    kind: 'obstacle',
    minimapGlyph: { shape: 'dot', size: 2, colourRole: 'obstacle' },
    footprintRadius: 10,
    isBlocking: true,
    displayName: null,
  },
};
