import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from './ContentCatalogue';
import { ContentValidationError } from './ContentValidationError';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import type { LegendDefinition } from './legends/legends.types';
import { MAGUS } from './legends/magus';
import { SENTINEL } from './legends/sentinel';
import { LEGEND_SPECS } from './legends/specs/legendSpecCatalogue';
import type { LegendSpecDefinition } from './legends/specs/legendSpecs.types';
import { ORACLE } from './legends/specs/oracle';
import { WARRIOR } from './legends/warrior';
import { loadDisplayContent } from './loadDisplayContent';
import { MAP_FEATURE_DEFINITIONS } from './maps/mapFeatureDefinitions';

/** The shipped Legends plus one whose class is the reserved, unplayable `flying`. */
const SPECS_WITH_FLYING = new ContentCatalogue<LegendSpecDefinition>([
  ...LEGEND_SPECS.all(),
  { ...ORACLE, id: 'skywatcher', classId: 'flying' },
]);

/** The map-feature kinds the HUD names (the Figma's layer names, pending HC-Q4). */
const NAMED_FEATURES = {
  stronghold: 'Stronghold',
  'wall-segment': 'Wall',
  'buff-tower': 'Buff Tower',
  'spawner-tower': 'Production Tower',
  'capture-point': 'Capture Point',
  cathedral: 'Cathedral',
};

describe('loadDisplayContent', () => {
  it('returns the validated Legend classes and Legends, in catalogue order', () => {
    const content = loadDisplayContent();

    expect(content.legends.map((legend) => legend.id)).toEqual(['warrior', 'sentinel', 'magus']);
    expect(content.legends).toEqual(LEGEND_CLASSES.all());
    expect(content.specs).toHaveLength(8);
    expect(content.specs.map((spec) => spec.id)).toEqual(LEGEND_SPECS.ids);
  });

  it('names the HUD map-feature kinds and leaves every other feature unnamed', () => {
    const { mapFeatures } = loadDisplayContent();
    const named = Object.fromEntries(
      mapFeatures.flatMap(({ id, displayName }) =>
        displayName === null ? [] : [[id, displayName]],
      ),
    );

    expect(named).toEqual(NAMED_FEATURES);
    expect(mapFeatures.map((feature) => feature.id)).toEqual(Object.keys(MAP_FEATURE_DEFINITIONS));
  });

  it('carries each feature kind with its name', () => {
    const capturePoint = loadDisplayContent().mapFeatures.find(
      (feature) => feature.id === 'capture-point',
    );

    expect(capturePoint).toEqual({
      id: 'capture-point',
      kind: 'capture-point',
      displayName: 'Capture Point',
    });
  });

  it('rejects a Legend whose class is not a loaded Legend class', () => {
    expect(() => loadDisplayContent({ specs: SPECS_WITH_FLYING })).toThrow(
      new ContentValidationError(
        'Invalid content: skywatcher: classId "flying" is not a Legend class',
      ),
    );
  });

  it('checks the Legend classes first and leaves the Legends unchecked while a class fails', () => {
    const legends = new ContentCatalogue<LegendDefinition>([
      WARRIOR,
      SENTINEL,
      { ...MAGUS, baseAether: 0 },
    ]);

    expect(() => loadDisplayContent({ legends, specs: SPECS_WITH_FLYING })).toThrow(
      new ContentValidationError(
        'Invalid content: magus: baseAether must be a positive finite number',
      ),
    );
  });
});
