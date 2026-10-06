import type { ComponentType } from './Entity.types';

/**
 * Root of the entity hierarchy. Subclasses set `kind` and `family`, install their components
 * on spawn, and may hook into spawn/retire.
 */
export abstract class Entity {
  /** The entity's family (e.g. `unit`, `legend`, `mob`). */
  public abstract readonly family: string;

  /** The concrete class id; the `EntityRegistry` key. */
  public abstract readonly kind: string;

  private readonly components = new Map<ComponentType, unknown>();

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
    this.installComponents(context);
    this.onSpawn?.(context);
  }

  /** Runs `onRetire`, then drops every component. Requires a non-empty cause. */
  public retire(cause: string, context?: unknown): void {
    if (!cause) {
      throw new Error('Entity retire requires a removal cause.');
    }

    this.onRetire?.(cause, context);
    this.components.clear();
  }

  /** Stores `component` under `type`, replacing any previous one. */
  public addComponent(type: ComponentType, component: unknown): void {
    this.components.set(type, component);
  }

  /** Returns the component for `type`; a missing component is a bug and throws. */
  public getComponent(type: ComponentType): unknown {
    const component = this.components.get(type);

    if (component === undefined) {
      throw new Error(`Missing component for type "${String(type)}".`);
    }

    return component;
  }

  /** Returns the component for `type`, or `undefined` if absent. */
  public findComponent(type: ComponentType): unknown {
    return this.components.get(type);
  }

  /** Whether a component is stored under `type`. */
  public hasComponent(type: ComponentType): boolean {
    return this.components.has(type);
  }

  /** Installs this entity's components. Required in every concrete subclass. */
  protected abstract installComponents(context: unknown): void;

  /** Optional per-class setup after components are installed. */
  protected onSpawn?(context: unknown): void;

  /** Optional cleanup before components are cleared. */
  protected onRetire?(cause: string, context: unknown): void;
}
