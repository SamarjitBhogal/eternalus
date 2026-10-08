import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { EntityView } from './EntityView.types';
import { ViewRegistry } from './ViewRegistry';

const view = (): EntityView => ({ draw: () => undefined });

const entity = (kind: string, family: string): EntitySnapshot => ({
  id: 'entity-1',
  kind,
  family,
  definitionId: kind,
  team: null,
  transform: null,
  health: null,
});

describe('ViewRegistry', () => {
  it('picks the kind view first, then the family view, then the default', () => {
    const fallback = view();
    const byKind = view();
    const byFamily = view();
    const registry = new ViewRegistry(fallback);
    registry.registerKind('warrior', byKind);
    registry.registerFamily('legend', byFamily);

    expect(registry.viewFor(entity('warrior', 'legend'))).toBe(byKind);
    expect(registry.viewFor(entity('magus', 'legend'))).toBe(byFamily);
    expect(registry.viewFor(entity('boulder', 'obstacle'))).toBe(fallback);
  });

  it('reports each kind that falls back to the default view only once', () => {
    const unknown: string[] = [];
    const registry = new ViewRegistry(view(), (kind) => unknown.push(kind));

    registry.viewFor(entity('beacon', 'structure'));
    registry.viewFor(entity('beacon', 'structure'));
    registry.viewFor(entity('boulder', 'obstacle'));

    expect(unknown).toEqual(['beacon', 'boulder']);
  });

  it('refuses a second view for the same kind or family', () => {
    const registry = new ViewRegistry(view());
    registry.registerKind('warrior', view());
    registry.registerFamily('legend', view());

    expect(() => {
      registry.registerKind('warrior', view());
    }).toThrow('Entity kind "warrior" already has a view.');
    expect(() => {
      registry.registerFamily('legend', view());
    }).toThrow('Entity family "legend" already has a view.');
  });
});
