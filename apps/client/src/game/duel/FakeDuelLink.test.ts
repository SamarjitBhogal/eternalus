import { describe, expect, it } from 'vitest';

import { snapshotAtTick } from './__fixtures__/snapshots';
import { FakeDuelLink } from './FakeDuelLink';

const SNAPSHOT = snapshotAtTick(1);

describe('FakeDuelLink', () => {
  it('serves the snapshot set last and records intents in order', () => {
    const link = new FakeDuelLink('entity-2', SNAPSHOT);
    const intent = { move: { x: 1, y: 0 }, aim: null, triggered: [] };

    link.sendIntent(intent);
    link.sendIntent({ ...intent, move: { x: 0, y: 1 } });

    expect(link.legendId).toBe('entity-2');
    expect(link.latestSnapshot()).toBe(SNAPSHOT);
    expect(link.intents.map(({ move }) => move)).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
  });
});
