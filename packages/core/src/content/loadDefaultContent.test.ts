import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { loadDefaultContent } from './loadDefaultContent';
import { MOB_DEFINITIONS } from './mobs/mobCatalogue';
import { UnknownDefinitionError } from './UnknownDefinitionError';

const TICK_RATE = createDefaultGameConfig().tickRate;

describe('loadDefaultContent', () => {
  it('holds every Legend class and then every mob (the training dummy), once each', () => {
    expect(loadDefaultContent(TICK_RATE).ids).toEqual([
      ...LEGEND_CLASSES.ids,
      ...MOB_DEFINITIONS.ids,
    ]);
  });

  it('converts speeds from per second to per tick: the Warrior runs 6 m/s', () => {
    const warrior = loadDefaultContent(TICK_RATE).get('warrior').movementProfile;

    expect(warrior.maxSpeed).toBeCloseTo(6 / TICK_RATE);
    expect(warrior.acceleration).toBeCloseTo(45 / TICK_RATE ** 2);
    expect(warrior.mass).toBe(LEGEND_CLASSES.get('warrior').movementProfile.mass);
  });

  it('keeps the time to top speed whatever the tick rate (the Sentinel: walk speed, then the ramp)', () => {
    const authored = LEGEND_CLASSES.get('sentinel').movementProfile;
    const { walkSpeed, rampDuration } = authored.momentum ?? { walkSpeed: 0, rampDuration: 0 };
    for (const tickRate of [30, 60]) {
      const { acceleration, momentum } =
        loadDefaultContent(tickRate).get('sentinel').movementProfile;

      expect(momentum?.walkSpeed).toBeCloseTo(walkSpeed / tickRate);
      expect(momentum?.rampDuration).toBe(rampDuration * tickRate);
      expect(momentum?.grip).toBeCloseTo((authored.momentum?.grip ?? 0) / tickRate ** 2);
      expect((momentum?.walkSpeed ?? 0) / acceleration / tickRate).toBeCloseTo(
        walkSpeed / authored.acceleration,
      );
    }
  });

  it('freezes the loaded definitions and leaves the authored ones untouched', () => {
    const content = loadDefaultContent(TICK_RATE);

    for (const definition of content.all()) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.movementProfile)).toBe(true);
    }
    expect(LEGEND_CLASSES.get('warrior').movementProfile.maxSpeed).toBe(6);
  });

  it('throws UnknownDefinitionError for a dangling definition id', () => {
    expect(() => loadDefaultContent(TICK_RATE).get('no-such-unit')).toThrow(UnknownDefinitionError);
  });

  it('validates Legends against the level curves it is given', () => {
    expect(() => loadDefaultContent(TICK_RATE, { has: () => false })).toThrow(
      'warrior: levelCurveId "legend" is not a known curve',
    );
  });
});
