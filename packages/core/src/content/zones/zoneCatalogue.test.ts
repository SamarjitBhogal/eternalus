import { describe, expect, it } from 'vitest';

import { ZONE_DEFINITIONS, ZONE_PLACEMENTS } from './zoneCatalogue';

describe('ZONE_DEFINITIONS', () => {
  it('has one capture point for the outer lanes and one for the Cathedral', () => {
    expect(ZONE_DEFINITIONS.ids).toEqual(['capture-point', 'cathedral-capture-point']);
    for (const zone of ZONE_DEFINITIONS.all()) {
      expect(zone.kind).toBe('capture-point');
      expect(zone.radius).toBeGreaterThan(0);
    }
  });

  it('gives the Cathedral the capture court radius of its interior (PR #30)', () => {
    expect(ZONE_DEFINITIONS.get('cathedral-capture-point').radius).toBe(35);
  });

  it('places a known zone for every capture-point and Cathedral feature, and nothing else', () => {
    expect(ZONE_PLACEMENTS).toEqual({
      'capture-point': 'capture-point',
      cathedral: 'cathedral-capture-point',
    });
    for (const id of Object.values(ZONE_PLACEMENTS)) {
      expect(ZONE_DEFINITIONS.has(id)).toBe(true);
    }
  });
});
