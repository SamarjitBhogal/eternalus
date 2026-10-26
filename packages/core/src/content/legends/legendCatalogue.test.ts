import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from './legendCatalogue';
import type { LegendKind } from './legends.types';

/** Seconds of constant acceleration from a standstill to top speed (content is per second). */
const secondsToTopSpeed = (kind: LegendKind): number => {
  const { maxSpeed, acceleration } = LEGEND_CLASSES.get(kind).movement;
  return maxSpeed / acceleration;
};

describe('LEGEND_CLASSES', () => {
  it('lists the three MVP classes in character-select order (DEC-48: Legionnaire)', () => {
    expect(LEGEND_CLASSES.ids).toEqual(['warrior', 'sentinel', 'magus']);
    expect(LEGEND_CLASSES.all().map((legend) => legend.displayName)).toEqual([
      'Legionnaire',
      'Sentinel',
      'Magus',
    ]);
  });

  it('gives each class card its Figma role label (72:858–72:860)', () => {
    expect(LEGEND_CLASSES.all().map((legend) => legend.roleLabel)).toEqual([
      'Assault',
      'Tank',
      'Ranged',
    ]);
  });

  it('gives the Magus its Figma tagline and description, and invents none for the others', () => {
    const magus = LEGEND_CLASSES.get('magus');

    expect(magus.tagline).toBe('Aether  ·  Ranged Support');
    // The prose names the class: built from `displayName`, a name renamed without it fails here.
    expect(magus.description).toBe(
      `With a mastery of Aether, the ${magus.displayName} bends reality into torrents of ` +
        'destructive energy. Channeling natural and arcane forces to decimate the enemy from afar ' +
        'and enhance nearby allies.',
    );
    for (const kind of ['warrior', 'sentinel'] as const) {
      expect(LEGEND_CLASSES.get(kind).tagline).toBeNull();
      expect(LEGEND_CLASSES.get(kind).description).toBeNull();
    }
  });

  it('gives the Magus the alternate layout description (62:82) and none to the others', () => {
    const magus = LEGEND_CLASSES.get('magus');

    expect(magus.alternateLayoutDescription).toBe(
      `The masters of Aether, ${magus.displayName} focus on the use of \n` +
        'abilities, while providing buffs for allies, and de-buffing \n' +
        `enemy units. Specializing in ranged attacks, ${magus.displayName} \n` +
        'aim to keep their distance from enemies to dish out \n' +
        'damage with high sustain. ',
    );
    for (const kind of ['warrior', 'sentinel'] as const) {
      expect(LEGEND_CLASSES.get(kind).alternateLayoutDescription).toBeNull();
    }
  });

  it('names the Magus detail rows from the Figma (72:757) and leaves the others unnamed', () => {
    expect(LEGEND_CLASSES.get('magus').detailNames).toEqual({
      signature: 'Aetheric Recall',
      proficiency: 'Staff Proficiency',
      specialty: 'Arcane Intellect',
    });
    for (const kind of ['warrior', 'sentinel'] as const) {
      expect(LEGEND_CLASSES.get(kind).detailNames).toEqual({
        signature: null,
        proficiency: null,
        specialty: null,
      });
    }
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
    expect(secondsToTopSpeed('sentinel')).toBeGreaterThanOrEqual(30);
    expect(secondsToTopSpeed('sentinel')).toBeLessThanOrEqual(60);
  });

  it('gets the Warrior to top speed fastest', () => {
    expect(secondsToTopSpeed('warrior')).toBeLessThan(secondsToTopSpeed('magus'));
    expect(secondsToTopSpeed('magus')).toBeLessThan(secondsToTopSpeed('sentinel'));
  });

  it('gives each class the weapon bias, damage focus and pick-up style from 01-classes', () => {
    const traits = LEGEND_CLASSES.all().map(({ id, weaponBias, damageFocus, pickUp }) => ({
      id,
      weaponBias,
      damageFocus,
      pickUp,
    }));

    expect(traits).toEqual([
      { id: 'warrior', weaponBias: 'light', damageFocus: 'mixed', pickUp: 'pick-up' },
      { id: 'sentinel', weaponBias: 'heavy', damageFocus: 'physical', pickUp: 'grab' },
      { id: 'magus', weaponBias: 'staff', damageFocus: 'magic', pickUp: 'levitate' },
    ]);
  });

  it('gives the passives and default action from 01-classes (Warrior has no passive)', () => {
    expect(LEGEND_CLASSES.get('warrior').passiveOptions).toEqual([]);
    expect(LEGEND_CLASSES.get('sentinel').passiveOptions).toEqual(['wrecking-run']);
    expect(LEGEND_CLASSES.get('magus').passiveOptions).toEqual(['studious', 'necromancy']);
    expect(LEGEND_CLASSES.all().map((legend) => legend.defaultAction)).toEqual([
      null,
      null,
      'revive',
    ]);
  });

  it('orders reference heights like the game doc: Warrior, then Magus, then Sentinel', () => {
    const height = (kind: LegendKind): number => LEGEND_CLASSES.get(kind).referenceHeight;

    expect(height('warrior')).toBeLessThan(height('magus'));
    expect(height('magus')).toBeLessThan(height('sentinel'));
  });

  it('lets every Legend see further than its own footprint', () => {
    for (const legend of LEGEND_CLASSES.all()) {
      expect(legend.visionRadius).toBeGreaterThan(legend.footprintRadius);
    }
  });
});
