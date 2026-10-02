import { Unit } from './Unit.js';

export class Legend extends Unit {
  constructor(id, definitionId) {
    if (new.target === Legend) {
      throw new Error('Legend is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }

  get family() {
    return 'legend';
  }
}
