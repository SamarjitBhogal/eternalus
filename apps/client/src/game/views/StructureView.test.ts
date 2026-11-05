import { describe, expect, it } from 'vitest';

import type { Renderer } from '../engine/render/Renderer';
import type { EntityView } from './EntityView.types';
import { StructureView } from './StructureView';

describe('StructureView', () => {
  it('draws nothing, leaving the building to the map layer', () => {
    const calls: string[] = [];
    const renderer = new Proxy(
      {},
      {
        get: (_, name) => (): void => {
          calls.push(String(name));
        },
      },
    ) as Renderer;
    const view: EntityView = new StructureView();

    view.draw(
      {
        entity: {
          id: 'entity-1',
          kind: 'gate',
          family: 'structure',
          definitionId: 'gate',
          team: 'light',
          transform: { x: 0, y: 0, radius: 3 },
          health: { current: 3000, max: 3000 },
        },
        position: { x: 0, y: 0 },
        isFocused: false,
      },
      renderer,
    );

    expect(calls).toEqual([]);
  });
});
