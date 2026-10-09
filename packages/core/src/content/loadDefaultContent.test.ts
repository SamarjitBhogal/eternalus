import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { loadDefaultContent } from './loadDefaultContent';
import { MOB_DEFINITIONS } from './mobs/mobCatalogue';
import { UnknownDefinitionError } from './UnknownDefinitionError';

describe('loadDefaultContent', () => {
  it('holds every Legend class and then every mob (the training dummy), once each', () => {
    expect(loadDefaultContent(30).ids).toEqual([...LEGEND_CLASSES.ids, ...MOB_DEFINITIONS.ids]);
  });

  it('converts speeds from per second to per tick: the Warrior runs 6 m/s = 0.2 m per tick', () => {
    const warrior = loadDefaultContent(30).get('warrior').movement;

    expect(warrior.maxSpeed).toBeCloseTo(0.2);
    expect(warrior.acceleration).toBeCloseTo(45 / 900);
    expect(warrior.mass).toBe(LEGEND_CLASSES.get('warrior').movement.mass);
  });

  it('keeps the time to top speed whatever the tick rate (50 s for the Sentinel)', () => {
    for (const tickRate of [30, 60]) {
      const { maxSpeed, acceleration } = loadDefaultContent(tickRate).get('sentinel').movement;

      expect(maxSpeed / acceleration / tickRate).toBeCloseTo(50);
    }
  });

  it('freezes the loaded definitions and leaves the authored ones untouched', () => {
    const content = loadDefaultContent(30);

    for (const definition of content.all()) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.movement)).toBe(true);
    }
    expect(LEGEND_CLASSES.get('warrior').movement.maxSpeed).toBe(6);
  });

  it('throws UnknownDefinitionError for a dangling definition id', () => {
    expect(() => loadDefaultContent(30).get('no-such-unit')).toThrow(UnknownDefinitionError);
  });
});
