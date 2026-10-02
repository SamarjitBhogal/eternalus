import { Entity } from './Entity.js';

export class Unit extends Entity {
  constructor(id, definitionId) {
    if (new.target === Unit) {
      throw new Error('Unit is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }

  get family() {
    return 'unit';
  }
}
