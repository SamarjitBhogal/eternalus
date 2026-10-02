export class Entity {
  constructor(id, definitionId) {
    if (new.target === Entity) {
      throw new Error('Entity is abstract and cannot be instantiated directly.');
    }

    this.id = id;
    this.definitionId = definitionId;
    this._components = new Map();
  }

  get kind() {
    throw new Error('Entity subclasses must define a kind.');
  }

  get family() {
    throw new Error('Entity subclasses must define a family.');
  }

  spawn(context) {
    this.installComponents(context);
    this.onSpawn(context);
  }

  retire(cause, context) {
    if (cause === undefined || cause === null || cause === '') {
      throw new Error('Entity retire requires a removal cause.');
    }

    this.onRetire(cause, context);
    this._components.clear();
  }

  addComponent(type, component) {
    this._components.set(type, component);
  }

  getComponent(type) {
    const component = this._components.get(type);

    if (component === undefined) {
      throw new Error(`Missing component for type "${String(type)}".`);
    }

    return component;
  }

  findComponent(type) {
    return this._components.get(type);
  }

  hasComponent(type) {
    return this._components.has(type);
  }

  installComponents() {
    throw new Error('Entity subclasses must implement installComponents(context).');
  }

  onSpawn() {}

  onRetire() {}
}
