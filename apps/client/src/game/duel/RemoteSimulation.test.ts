import { describe, expect, it } from 'vitest';

import { snapshotAtTick } from './__fixtures__/snapshots';
import { FakeDuelLink } from './FakeDuelLink';
import { RemoteSimulation } from './RemoteSimulation';

describe('RemoteSimulation', () => {
  it('starts on the snapshot that started the Duel', () => {
    const first = snapshotAtTick(2);
    const simulation = new RemoteSimulation(new FakeDuelLink('entity-1', first), first);

    expect(simulation.snapshot()).toBe(first);
    expect(simulation.tick).toBe(2);
  });

  it('adopts the newest snapshot the server sent on each step, and keeps it when none is new', () => {
    const first = snapshotAtTick(1);
    const link = new FakeDuelLink('entity-1', first);
    const simulation = new RemoteSimulation(link, first);
    const second = snapshotAtTick(3);

    link.snapshot = second;
    simulation.step();
    simulation.step();

    expect(simulation.snapshot()).toBe(second);
    expect(simulation.tick).toBe(3);
  });

  it('has no game events online: a listener never fires and unsubscribing is safe', () => {
    const first = snapshotAtTick(1);
    const simulation = new RemoteSimulation(new FakeDuelLink('entity-1', first), first);

    const unsubscribe = simulation.on();

    expect(unsubscribe).not.toThrow();
  });
});
