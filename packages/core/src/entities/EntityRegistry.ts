import { Entity } from './Entity';
import type { EntityConstructor } from './EntityRegistry.types';

/** Maps entity kinds to the concrete classes that build them. */
export class EntityRegistry {
  private readonly constructors = new Map<string, EntityConstructor>();

  /** Registers `entityConstructor` under `kind`. Throws on empty, duplicate or non-Entity input. */
  public register(kind: string, entityConstructor: EntityConstructor): void {
    if (!kind) {
      throw new Error('Entity kind must be a non-empty string.');
    }

    if (typeof entityConstructor !== 'function') {
      throw new Error(`Invalid entity registration for "${kind}": constructor must be a class.`);
    }

    if (!(entityConstructor.prototype instanceof Entity)) {
      throw new Error(`Invalid entity registration for "${kind}": constructor must extend Entity.`);
    }

    if (this.constructors.has(kind)) {
      throw new Error(`Entity kind "${kind}" is already registered.`);
    }

    this.constructors.set(kind, entityConstructor);
  }

  /** Returns the class registered for `kind`, or `undefined`. */
  public get(kind: string): EntityConstructor | undefined {
    return this.constructors.get(kind);
  }

  /** Whether `kind` is registered. */
  public has(kind: string): boolean {
    return this.constructors.has(kind);
  }
}
