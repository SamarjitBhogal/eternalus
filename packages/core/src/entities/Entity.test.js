import { describe, expect, it } from 'vitest';

import { Entity } from './Entity.js';

class ConcreteEntity extends Entity {
  constructor(id, definitionId, calls) {
    super(id, definitionId);
    this.calls = calls;
  }

  get kind() {
    return 'test-kind';
  }

  get family() {
    return 'test-family';
  }

  installComponents(context) {
    this.calls.push(['install-components', context]);
    this.addComponent('health', { value: 10 });
  }

  onSpawn(context) {
    this.calls.push(['on-spawn', context]);
  }

  onRetire(cause, context) {
    this.calls.push(['on-retire', cause, context]);
  }
}

class IncompleteEntity extends Entity {
  installComponents() {}
}

class HooklessEntity extends Entity {
  get kind() {
    return 'hookless';
  }

  get family() {
    return 'hookless-family';
  }

  installComponents() {}
}

describe('Entity', () => {
  it('is abstract-by-convention and cannot be constructed directly', () => {
    expect(() => new Entity('entity-1', 'test-definition')).toThrow(
      'Entity is abstract and cannot be instantiated directly.',
    );
  });

  it('runs lifecycle hooks in order and clears components on retire', () => {
    const calls = [];
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
  });

  it('requires a removal cause when retiring an entity', () => {
    const entity = new ConcreteEntity('entity-4', 'test-definition', []);

    expect(() => entity.retire()).toThrow('Entity retire requires a removal cause.');
    expect(() => entity.retire('')).toThrow('Entity retire requires a removal cause.');
  });

  it('requires subclasses to define kind and family', () => {
    const entity = new IncompleteEntity('entity-5', 'test-definition');

    expect(() => entity.kind).toThrow('Entity subclasses must define a kind.');
    expect(() => entity.family).toThrow('Entity subclasses must define a family.');
  });

  it('provides no-op lifecycle hooks by default', () => {
    const entity = new HooklessEntity('entity-6', 'test-definition');

    expect(() => entity.spawn({})).not.toThrow();
    expect(() => entity.retire('cleanup', {})).not.toThrow();
  });
});
