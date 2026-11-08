import { describe, expect, it } from 'vitest';

import { MAP_FEATURE_DEFINITIONS } from '../maps/mapFeatureDefinitions';
import { ZONE_DEFINITIONS, ZONE_PLACEMENTS } from './zoneCatalogue';

describe('ZONE_DEFINITIONS', () => {
  it('has one capture point for the outer lanes and one for the Cathedral', () => {
    expect(ZONE_DEFINITIONS.ids).toEqual(['capture-point', 'cathedral-capture-point']);
    for (const zone of ZONE_DEFINITIONS.all()) {
      expect(zone.kind).toBe('capture-point');
      // No size: a zone covers its building's floor, tested in `map/zoneArea.test.ts` (DEC-145).
      expect(zone).not.toHaveProperty('radius');
    }
  });

  it('shows each zone on the minimap with the glyph of the map feature that places it', () => {
    for (const [featureKind, zoneId] of Object.entries(ZONE_PLACEMENTS)) {
      expect(ZONE_DEFINITIONS.get(zoneId).minimapGlyph).toEqual(
        MAP_FEATURE_DEFINITIONS[featureKind]?.minimapGlyph,
      );
    }
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
