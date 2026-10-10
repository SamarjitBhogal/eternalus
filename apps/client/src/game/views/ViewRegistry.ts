import type { EntitySnapshot } from '@eternalus/core';

import type { EntityView } from './EntityView.types';

/**
 * Finds the view for an entity (Registry pattern, architecture 08 §8): its kind's view, else its
 * family's view, else the default view. Adding a look for a kind is one `registerKind` line;
 * no `switch` on kind exists in `views/`.
 */
export class ViewRegistry {
  private readonly byKind = new Map<string, EntityView>();

  private readonly byFamily = new Map<string, EntityView>();

  private readonly reported = new Set<string>();

  /**
   * Creates a registry.
   *
   * @param defaultView - Draws every entity whose kind and family have no view.
   * @param onUnknownKind - Told once per kind that falls back to the default view.
   */
  public constructor(
    private readonly defaultView: EntityView,
    private readonly onUnknownKind: (kind: string) => void = () => undefined,
  ) {}

  /** Uses `view` for every entity of `kind`. Throws if the kind already has a view. */
  public registerKind(kind: string, view: EntityView): void {
    ViewRegistry.add(this.byKind, 'kind', kind, view);
  }

  /** Uses `view` for every entity of `family` whose kind has no view. Throws on duplicates. */
  public registerFamily(family: string, view: EntityView): void {
    ViewRegistry.add(this.byFamily, 'family', family, view);
  }

  /** The view that draws `entity`. */
  public viewFor(entity: EntitySnapshot): EntityView {
    const view = this.byKind.get(entity.kind) ?? this.byFamily.get(entity.family);
    if (view !== undefined) {
      return view;
    }
    if (!this.reported.has(entity.kind)) {
      this.reported.add(entity.kind);
      this.onUnknownKind(entity.kind);
    }
    return this.defaultView;
  }

  private static add(
    views: Map<string, EntityView>,
    what: string,
    key: string,
    view: EntityView,
  ): void {
    if (views.has(key)) {
      throw new Error(`Entity ${what} "${key}" already has a view.`);
    }
    views.set(key, view);
  }
}
