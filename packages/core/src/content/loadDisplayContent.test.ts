import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from './ContentCatalogue';
import { ContentValidationError } from './ContentValidationError';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import type { LegendDefinition } from './legends/legends.types';
import { HARBINGER } from './legends/locked/harbinger';
import type { LockedClassDefinition } from './legends/locked/lockedClasses.types';
import { MAGUS } from './legends/magus';
import { SENTINEL } from './legends/sentinel';
import { LEGEND_SPECS } from './legends/specs/legendSpecCatalogue';
import type { LegendSpecDefinition } from './legends/specs/legendSpecs.types';
import { ORACLE } from './legends/specs/oracle';
import { WARRIOR } from './legends/warrior';
import { loadDisplayContent } from './loadDisplayContent';
import { MAP_FEATURE_DEFINITIONS } from './maps/mapFeatureDefinitions';
import { VERDICT_LINES } from './narrative/verdictLines';
import { BOT_ROSTER } from './teams/botRoster';

/** The shipped Legends plus one whose class is the reserved, unplayable `harbinger`. */
const SPECS_WITH_HARBINGER = new ContentCatalogue<LegendSpecDefinition>([
  ...LEGEND_SPECS.all(),
  { ...ORACLE, id: 'skywatcher', classId: 'harbinger' },
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

    expect(content.legends.map((legend) => legend.id)).toEqual(LEGEND_CLASSES.ids);
    expect(content.legends).toEqual(LEGEND_CLASSES.all());
    expect(content.specs).toEqual(LEGEND_SPECS.all());
    expect(content.specs.map((spec) => spec.id)).toEqual(LEGEND_SPECS.ids);
  });

  it('returns the locked classes the selection screen shows after the playable ones', () => {
    // The card's values are pinned once, in lockedClassCatalogue.test.ts.
    expect(loadDisplayContent().lockedClasses).toEqual([HARBINGER]);
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
    expect(() => loadDisplayContent({ specs: SPECS_WITH_HARBINGER })).toThrow(
      new ContentValidationError(
        'Invalid content: skywatcher: classId "harbinger" is not a Legend class',
      ),
    );
  });

  it('checks the Legend classes first and leaves the Legends unchecked while a class fails', () => {
    const legends = new ContentCatalogue<LegendDefinition>([
      WARRIOR,
      SENTINEL,
      { ...MAGUS, baseAether: 0 },
    ]);

    expect(() => loadDisplayContent({ legends, specs: SPECS_WITH_HARBINGER })).toThrow(
      new ContentValidationError(
        'Invalid content: magus: baseAether must be a positive finite number',
      ),
    );
  });

  it('rejects a locked class whose id is not kebab-case', () => {
    const lockedClasses = new ContentCatalogue<LockedClassDefinition>([
      { ...HARBINGER, id: 'Harbinger' },
    ]);

    expect(() => loadDisplayContent({ lockedClasses })).toThrow(
      new ContentValidationError('Invalid content: Harbinger: id must be kebab-case'),
    );
  });

  it('names the two playable teams', () => {
    expect(loadDisplayContent().teamNames).toEqual({ light: 'Light', dark: 'Dark' });
  });

  it('names the profile screen', () => {
    expect(loadDisplayContent().profileDisplayName).toBe('Chronicle');
  });

  it('returns the verdict lines, one set for the only condition that ends a match today', () => {
    const { verdictLines } = loadDisplayContent();

    expect(verdictLines).toBe(VERDICT_LINES);
    expect(Object.keys(verdictLines)).toEqual(['objective-lost']);
  });

  it("names each team's sovereign Emperor by default (DEC-74)", () => {
    expect(loadDisplayContent().sovereignNames).toEqual({ light: 'Emperor', dark: 'Emperor' });
  });

  it('returns the shipped bot roster (DEC-61, DEC-102)', () => {
    expect(loadDisplayContent().botRoster).toBe(BOT_ROSTER);
  });

  it('rejects a bot roster that gives a bot the locked harbinger (DEC-48)', () => {
    const botRoster = { ...BOT_ROSTER, laners: [...BOT_ROSTER.laners.slice(1), 'harbinger'] };

    expect(() => loadDisplayContent({ botRoster })).toThrow(
      new ContentValidationError(
        'Invalid content: standard: laner class "harbinger" is not a playable Legend class',
      ),
    );
  });
});
