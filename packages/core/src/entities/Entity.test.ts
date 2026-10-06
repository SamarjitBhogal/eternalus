import { describe, expect, it } from 'vitest';

import { Entity } from './Entity';

class TestHealth {
  public constructor(public readonly value: number) {}
}

class TestMovement {
  public constructor(public readonly speed: number) {}
}

class Marker {
  public readonly tag = 'marker';
}

class Missing {
  public readonly tag = 'missing';
}

class ConcreteEntity extends Entity {
  public constructor(
    id: string,
    definitionId: string,
    public readonly calls: unknown[][],
  ) {
    super(id, definitionId);
  }

  public readonly kind = 'test-kind';

  public readonly family = 'test-family';

  protected installComponents(context: unknown): void {
    this.calls.push(['install-components', context]);
    this.addComponent(new TestHealth(10));
  }

  protected override onSpawn(context: unknown): void {
    this.calls.push(['on-spawn', context]);
  }

  protected override onRetire(cause: string, context: unknown): void {
    this.calls.push(['on-retire', cause, context]);
  }
}

class HooklessEntity extends Entity {
  public readonly kind = 'hookless';

  public readonly family = 'hookless-family';

  protected installComponents(): void {
    this.addComponent(new Marker());
  }
}

describe('Entity', () => {
  it('is abstract and cannot be constructed directly', () => {
    expect(() => {
      Reflect.construct(Entity, ['entity-1', 'test-definition']);
    }).toThrow('Entity is abstract and cannot be instantiated directly.');
  });

  it('runs lifecycle hooks in order and clears components on retire', () => {
    const calls: unknown[][] = [];
    const entity = new ConcreteEntity('entity-2', 'test-definition', calls);

    entity.spawn({ spawn: true });
    entity.retire('destroyed', { remove: true });

    expect(calls).toEqual([
      ['install-components', { spawn: true }],
      ['on-spawn', { spawn: true }],
      ['on-retire', 'destroyed', { remove: true }],
    ]);
    expect(entity.hasComponent(TestHealth)).toBe(false);
  });

  it('provides component access helpers', () => {
    const entity = new ConcreteEntity('entity-3', 'test-definition', []);
    const component = new TestMovement(5);
    entity.addComponent(component);

    expect(entity.hasComponent(TestMovement)).toBe(true);
    expect(entity.findComponent(TestMovement)).toBe(component);
    // The return type is TestMovement, so `.speed` type-checks with no cast.
    expect(entity.getComponent(TestMovement).speed).toBe(5);
    expect(entity.findComponent(Missing)).toBeUndefined();
    expect(() => entity.getComponent(Missing)).toThrow('Missing component "Missing".');
  });

  it('replaces a component of the same class', () => {
    const entity = new ConcreteEntity('entity-7', 'test-definition', []);
    entity.addComponent(new TestMovement(1));
    entity.addComponent(new TestMovement(2));

    expect(entity.getComponent(TestMovement).speed).toBe(2);
  });

  it('requires a removal cause when retiring an entity', () => {
    const entity = new ConcreteEntity('entity-4', 'test-definition', []);

    expect(() => {
      // @ts-expect-error -- exercises the runtime guard for callers that bypass the type
      entity.retire();
    }).toThrow('Entity retire requires a removal cause.');
    expect(() => {
      entity.retire('');
    }).toThrow('Entity retire requires a removal cause.');
  });

  it('requires subclasses to define kind and family at compile time', () => {
    // @ts-expect-error -- abstract kind and family are not implemented
    class IncompleteEntity extends Entity {
      protected installComponents(): void {
        this.addComponent(new Marker());
      }
    }

    expect(new IncompleteEntity('entity-5', 'test-definition')).toBeInstanceOf(Entity);
  });

  it('works without the optional lifecycle hooks', () => {
    const entity = new HooklessEntity('entity-6', 'test-definition');

    entity.spawn({});
    expect(entity.hasComponent(Marker)).toBe(true);
    entity.retire('cleanup', {});
    expect(entity.hasComponent(Marker)).toBe(false);
  });
});
