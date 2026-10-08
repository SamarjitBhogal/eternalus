import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Vision } from '../components/Vision';
import type { UnitDefinition } from '../content/units/units.types';
import { Unit } from './Unit';
import { UnitComponentInstaller } from './UnitComponentInstaller';

class ConcreteUnit extends Unit {
  public readonly kind = 'concrete-unit';

  protected installComponents(context: unknown): void {
    new UnitComponentInstaller(this).install(context);
  }
}

const DEFINITION: UnitDefinition = {
  id: 'concrete-definition',
  kind: 'concrete-unit',
  displayName: 'Concrete Unit',
  baseHealth: 50,
  footprintRadius: 0.5,
  visionRadius: 12,
  movement: { maxSpeed: 0.2, acceleration: 0.05, mass: 1 },
};

describe('UnitComponentInstaller', () => {
  it('installs every unit component from the definition', () => {
    const unit = new ConcreteUnit('unit-1', 'concrete-definition');

    unit.spawn({ definition: DEFINITION, position: { x: 3, y: 4 }, team: 'dark' });

    expect(unit.getComponent(Transform).position).toEqual({ x: 3, y: 4 });
    expect(unit.getComponent(Transform).radius).toBe(0.5);
    expect(unit.getComponent(Health).current).toBe(50);
    expect(unit.getComponent(Movement).maxSpeed).toBe(0.2);
    expect(unit.getComponent(TeamMembership).team).toBe('dark');
    expect(unit.getComponent(Collider).shape).toEqual({ kind: 'circle', radius: 0.5 });
    expect(unit.getComponent(Collider).layer).toBe('unit');
    expect(unit.getComponent(Vision).radius).toBe(12);
  });

  it("rejects another unit's definition and installs nothing", () => {
    const unit = new ConcreteUnit('unit-2', 'concrete-definition');

    expect(() => {
      unit.spawn({
        definition: { ...DEFINITION, id: 'other-definition' },
        position: { x: 0, y: 0 },
        team: 'light',
      });
    }).toThrow('got definition "other-definition" (concrete-unit)');
    expect(unit.hasComponent(Transform)).toBe(false);
  });

  it('rejects a context that is not a placed spawn context', () => {
    const unit = new ConcreteUnit('unit-3', 'concrete-definition');

    expect(() => {
      unit.spawn({ definition: DEFINITION, position: { x: 0, y: 0 }, team: 'purple' });
    }).toThrow('needs a spawn context with a team');
    expect(() => {
      unit.spawn(undefined);
    }).toThrow('needs a spawn context with a definition and a position');
  });
});
