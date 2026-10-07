import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from './legendClasses';
import type { LegendKind } from './legends.types';

const TICKS_PER_SECOND = 30;

/** Ticks of constant acceleration from a standstill to top speed. */
const ticksToTopSpeed = (kind: LegendKind): number => {
  const { maxSpeed, acceleration } = LEGEND_CLASSES.get(kind).movement;
  return Math.ceil(maxSpeed / acceleration);
};

describe('LEGEND_CLASSES', () => {
  it('lists the three MVP classes in character-select order (DEC-08: Warrior, not Assault)', () => {
    expect(LEGEND_CLASSES.ids).toEqual(['warrior', 'sentinel', 'magus']);
    expect(LEGEND_CLASSES.all().map((legend) => legend.displayName)).toEqual([
      'Warrior',
      'Sentinel',
      'Magus',
    ]);
  });

  it('builds each class with the entity kind of the same name', () => {
    for (const legend of LEGEND_CLASSES.all()) {
      expect(legend.kind).toBe(legend.id);
      expect(legend.roleBlurb.length).toBeGreaterThan(0);
    }
  });

  it('uses the DEC-06 footprint radii in metres', () => {
    expect(LEGEND_CLASSES.get('warrior').footprintRadius).toBe(0.5);
    expect(LEGEND_CLASSES.get('magus').footprintRadius).toBe(0.75);
    expect(LEGEND_CLASSES.get('sentinel').footprintRadius).toBe(1.25);
  });

  it('keeps the class ordering from 01-classes: Warrior lightest, Sentinel heaviest', () => {
    const warrior = LEGEND_CLASSES.get('warrior');
    const sentinel = LEGEND_CLASSES.get('sentinel');
    const magus = LEGEND_CLASSES.get('magus');

    expect(warrior.baseHealth).toBeLessThan(magus.baseHealth);
    expect(magus.baseHealth).toBeLessThan(sentinel.baseHealth);
    expect(warrior.movement.mass).toBeLessThan(magus.movement.mass);
    expect(magus.movement.mass).toBeLessThan(sentinel.movement.mass);
  });

  it('gives the Sentinel the highest top speed but a run-up of about a minute', () => {
    const warrior = LEGEND_CLASSES.get('warrior');
    const sentinel = LEGEND_CLASSES.get('sentinel');
    const magus = LEGEND_CLASSES.get('magus');

    expect(sentinel.movement.maxSpeed).toBeGreaterThan(warrior.movement.maxSpeed);
    expect(sentinel.movement.maxSpeed).toBeGreaterThan(magus.movement.maxSpeed);
    expect(ticksToTopSpeed('sentinel') / TICKS_PER_SECOND).toBeGreaterThanOrEqual(30);
    expect(ticksToTopSpeed('sentinel') / TICKS_PER_SECOND).toBeLessThanOrEqual(60);
  });

  it('gets the Warrior to top speed fastest', () => {
    expect(ticksToTopSpeed('warrior')).toBeLessThan(ticksToTopSpeed('magus'));
    expect(ticksToTopSpeed('magus')).toBeLessThan(ticksToTopSpeed('sentinel'));
  });
});
