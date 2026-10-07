/**
 * The class of a component, used as its key on an entity (`entity.getComponent(Health)`).
 * Looking components up by class instead of by string lets TypeScript return the right type.
 */
export type ComponentType<T extends object = object> = abstract new (...args: never[]) => T;
