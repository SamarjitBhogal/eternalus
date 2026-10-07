import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendClasses';
import { MOB_DEFINITIONS } from './mobDefinitions';
import type { MobDefinition } from './mobs.types';

const mob = (id: string): MobDefinition => MOB_DEFINITIONS.get(id);

describe('MOB_DEFINITIONS', () => {
  it('has the three weight classes and the training dummy, in order', () => {
    expect(MOB_DEFINITIONS.ids).toEqual(['light-mob', 'medium-mob', 'heavy-mob', 'training-dummy']);

    expect(MOB_DEFINITIONS.all().map((definition) => definition.id)).toEqual(MOB_DEFINITIONS.ids);
  });

  it('grows in size, health and mass from light to heavy', () => {
    const [light, medium, heavy] = [mob('light-mob'), mob('medium-mob'), mob('heavy-mob')];

    expect(light.footprintRadius).toBeLessThan(medium.footprintRadius);
    expect(medium.footprintRadius).toBeLessThan(heavy.footprintRadius);
    expect(light.baseHealth).toBeLessThan(medium.baseHealth);
    expect(medium.baseHealth).toBeLessThan(heavy.baseHealth);
    expect(light.movement.mass).toBeLessThan(medium.movement.mass);
    expect(medium.movement.mass).toBeLessThan(heavy.movement.mass);
  });

  it('sizes the Warrior a little bigger than a light mob, about a medium one', () => {
    expect(LEGEND_CLASSES.get('warrior').footprintRadius).toBeGreaterThan(
      mob('light-mob').footprintRadius,
    );
    expect(LEGEND_CLASSES.get('warrior').footprintRadius).toBe(mob('medium-mob').footprintRadius);
  });

  it('builds the training dummy as a light mob that is slower than a real one', () => {
    const dummy = mob('training-dummy');

    expect(dummy.kind).toBe('light-mob');
    expect(dummy.movement.maxSpeed).toBeLessThan(mob('light-mob').movement.maxSpeed);
  });
});
