import type { EntitySnapshot, GameEventMap, Snapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { LegendBodies } from './LegendBodies';
import { LegendBodyLayer } from './views/LegendBodyLayer';

type Removed = (payload: GameEventMap['entity-removed']) => void;

const entity = (id: string, family: string): EntitySnapshot =>
  ({ id, family, transform: { x: 10, y: 20, radius: 3 } }) as unknown as EntitySnapshot;

const snapshotOf = (...entities: EntitySnapshot[]): Snapshot =>
  ({ entities }) as unknown as Snapshot;

describe('LegendBodies (DEC-295)', () => {
  it('leaves a body where a Legend died, none for a mob or another removal, and draws it greyed', () => {
    let removed: Removed = () => undefined;
    const bodies = new LegendBodies({
      on: ((_: string, handler: Removed) => {
        removed = handler;
        return () => undefined;
      }) as never,
    });
    bodies.observe(snapshotOf(entity('legend-1', 'legend'), entity('mob-1', 'mob')));

    removed({ entityId: 'legend-1', cause: 'died' });
    removed({ entityId: 'mob-1', cause: 'died' });
    removed({ entityId: 'legend-1', cause: 'match-ended' });

    expect(bodies.bodies()).toEqual([{ x: 10, y: 20, radius: 3 }]);
    const drawn: unknown[] = [];
    const layer = new LegendBodyLayer(bodies.bodies);
    layer.draw({ drawWorldGlyph: (...args: unknown[]) => drawn.push(args) } as never);
    layer.drawMinimap();
    expect(drawn).toEqual([[{ shape: 'dot', size: 6 }, { x: 10, y: 20 }, expect.any(String)]]);
    bodies.destroy();
  });
});
