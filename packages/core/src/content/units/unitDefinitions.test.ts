import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { UnknownDefinitionError } from '../UnknownDefinitionError';
import { UNIT_DEFINITIONS } from './unitDefinitions';

describe('UNIT_DEFINITIONS', () => {
  it('holds every Legend class and then every mob (the training dummy), once each', () => {
    expect(UNIT_DEFINITIONS.ids).toEqual([...LEGEND_CLASSES.ids, ...MOB_DEFINITIONS.ids]);
  });

  it('shares the same frozen definitions as the Legend and mob catalogues', () => {
    expect(UNIT_DEFINITIONS.get('warrior')).toBe(LEGEND_CLASSES.get('warrior'));
    expect(UNIT_DEFINITIONS.get('training-dummy')).toBe(MOB_DEFINITIONS.get('training-dummy'));

    for (const definition of UNIT_DEFINITIONS.all()) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.movement)).toBe(true);
    }
  });

  it('throws UnknownDefinitionError for a dangling definition id', () => {
    expect(() => UNIT_DEFINITIONS.get('no-such-unit')).toThrow(UnknownDefinitionError);
  });
});
