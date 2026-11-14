import type { ZoneDefinition } from './zones.types';

/** A runtime spell area, never a capture objective or physical blocker. */
export const SPELL_ZONE = {
  id: 'spell-zone',
  kind: 'effect-zone',
  displayName: 'Spell Area',
  minimapGlyph: { shape: 'ring', size: 0, colourRole: 'team' },
} as const satisfies ZoneDefinition;
