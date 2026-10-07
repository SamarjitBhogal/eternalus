/**
 * The class of a component, used as its key on an entity (`entity.get(Health)`).
 * Looking components up by class instead of by string lets TypeScript return the right type.
 */
export type ComponentType<T extends object = object> = abstract new (...args: never[]) => T;

/** The families an entity can belong to. Each family has one abstract class under `Entity`. */
export type EntityFamily =
  'legend' | 'mob' | 'boss' | 'structure' | 'zone' | 'obstacle' | 'projectile';
