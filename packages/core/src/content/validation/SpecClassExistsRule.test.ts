import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import { SpecClassExistsRule } from './SpecClassExistsRule';

const spec = (classId: string): LegendSpecDefinition => ({
  id: 'test-legend',
  classId,
  isSelectable: true,
  displayName: 'Test Legend',
  legendName: null,
  roleLabel: null,
  description: null,
  roleRatings: null,
  detailNames: { signature: null, specialty: null, ultimate: null },
});

describe('SpecClassExistsRule', () => {
  it('accepts a spec whose class is a loaded Legend class', () => {
    expect(new SpecClassExistsRule(LEGEND_CLASSES).check(spec('magus'))).toEqual([]);
  });

  it('flags a class id with no Legend class, such as the reserved flying', () => {
    expect(new SpecClassExistsRule(LEGEND_CLASSES).check(spec('flying'))).toEqual([
      'classId "flying" is not a Legend class',
    ]);
  });
});
