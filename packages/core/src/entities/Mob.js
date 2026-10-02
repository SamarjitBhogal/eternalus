import { Unit } from './Unit.js';

export class Mob extends Unit {
  constructor(id, definitionId) {
    if (new.target === Mob) {
      throw new Error('Mob is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }

  get family() {
    return 'mob';
  }
}
