import { describe, expect, it } from 'vitest';

import { Entity } from './Entity';

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
    this.addComponent('health', { value: 10 });
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
    this.addComponent('marker', true);
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
    expect(entity.hasComponent('health')).toBe(false);
  });

  it('provides component access helpers', () => {
    const entity = new ConcreteEntity('entity-3', 'test-definition', []);
    const component = { value: 5 };
    entity.addComponent('movement', component);

    expect(entity.hasComponent('movement')).toBe(true);
    expect(entity.findComponent('movement')).toBe(component);
    expect(entity.getComponent('movement')).toBe(component);
    expect(entity.findComponent('missing')).toBeUndefined();
    expect(() => entity.getComponent('missing')).toThrow('Missing component for type "missing".');
    expect(() => entity.getComponent(Symbol('gone'))).toThrow(
      'Missing component for type "Symbol(gone)".',
    );
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
        this.addComponent('marker', true);
      }
    }

    expect(new IncompleteEntity('entity-5', 'test-definition')).toBeInstanceOf(Entity);
  });

  it('works without the optional lifecycle hooks', () => {
    const entity = new HooklessEntity('entity-6', 'test-definition');

    entity.spawn({});
    expect(entity.hasComponent('marker')).toBe(true);
    entity.retire('cleanup', {});
    expect(entity.hasComponent('marker')).toBe(false);
  });
});
