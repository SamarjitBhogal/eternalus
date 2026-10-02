import { Entity } from './Entity.js';

export class EntityRegistry {
  constructor() {
    this._constructors = new Map();
  }

  register(kind, EntityConstructor) {
    if (typeof kind !== 'string' || kind.length === 0) {
      throw new Error('Entity kind must be a non-empty string.');
    }

    if (typeof EntityConstructor !== 'function') {
      throw new Error(`Invalid entity registration for "${kind}": constructor must be a class.`);
    }

    if (!(EntityConstructor.prototype instanceof Entity)) {
      throw new Error(`Invalid entity registration for "${kind}": constructor must extend Entity.`);
    }

    if (this._constructors.has(kind)) {
      throw new Error(`Entity kind "${kind}" is already registered.`);
    }

    this._constructors.set(kind, EntityConstructor);
  }

  get(kind) {
    return this._constructors.get(kind);
  }

  has(kind) {
    return this._constructors.has(kind);
  }
}
