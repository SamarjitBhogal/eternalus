import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { LEGEND_SPECS } from './legends/specs/legendSpecCatalogue';
import { loadDisplayContent } from './loadDisplayContent';
import { MAP_FEATURE_DEFINITIONS } from './maps/mapFeatureDefinitions';

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
});
