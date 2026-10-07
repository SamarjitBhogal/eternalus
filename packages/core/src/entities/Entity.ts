import type { ComponentType, EntityFamily } from './Entity.types';

/**
 * Root of the entity hierarchy. Subclasses set `kind` and `family`, install their components
 * on spawn, and may hook into spawn/retire.
 */
export abstract class Entity {
  /** The entity's family (e.g. `legend`, `mob`); set by the family's abstract class. */
  public abstract readonly family: EntityFamily;

  /** The concrete class id; the `EntityRegistry` key. */
  public abstract readonly kind: string;

  private readonly components = new Map<ComponentType, object>();

  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(
    public readonly id: string,
    public readonly definitionId: string,
  ) {
    if (new.target === Entity) {
      throw new Error('Entity is abstract and cannot be instantiated directly.');
    }
  }

  /** Installs components, then runs `onSpawn`. Called once by `EntityFactory`. */
  public spawn(context: unknown): void {
    this.attachComponents(context);
    this.onSpawn?.(context);
  }

  /** Runs `onRemove`, then drops every component. Requires a non-empty cause. */
  public retire(cause: string, context?: unknown): void {
    if (!cause) {
      throw new Error('Entity retire requires a removal cause.');
    }

    this.onRemove?.(cause, context);
    this.components.clear();
  }

  /** Stores `component` under its own class, replacing any previous one of that class. */
  public add(component: object): void {
    this.components.set(component.constructor as ComponentType, component);
  }

  /** Returns the component of class `type`; a missing component is a bug and throws. */
  public get<T extends object>(type: ComponentType<T>): T {
    const component = this.find(type);

    if (component === undefined) {
      throw new Error(`Missing component "${type.name}".`);
    }

    return component;
  }

  /** Returns the component of class `type`, or `undefined` if absent. */
  public find<T extends object>(type: ComponentType<T>): T | undefined {
    // Safe: add keys every component by its own class.
    return this.components.get(type) as T | undefined;
  }

  /** Whether a component of class `type` is attached. */
  public has(type: ComponentType): boolean {
    return this.components.has(type);
  }

  /** Installs this entity's components. Required in every concrete subclass. */
  protected abstract attachComponents(context: unknown): void;

  /** Optional per-class setup after components are installed. */
  protected onSpawn?(context: unknown): void;

  /** Optional cleanup before components are cleared. */
  protected onRemove?(cause: string, context: unknown): void;
}
