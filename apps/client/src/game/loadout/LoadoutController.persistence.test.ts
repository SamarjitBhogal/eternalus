import { NullLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../../bridge/events';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import { TypedEventBus } from '../../bridge/TypedEventBus';
import { MemoryStorageAdapter } from '../../data/persistence/MemoryStorageAdapter';
import { PersistenceController } from '../../data/persistence/PersistenceController';
import { LoadoutController } from './LoadoutController';

const OPTIONS: LoadoutsSliceState['options'] = {
  warrior: {
    defaultWeaponId: 'raptor-talons',
    weapons: [
      { id: 'raptor-talons', displayName: 'Raptor Talons' },
      { id: 'wuuthrad', displayName: 'Wuuthrad' },
    ],
  },
};

/** A controller over the real facade on shared in-memory storage, as `main.tsx` builds it. */
async function started(adapter: MemoryStorageAdapter, knownWeapons: ReadonlySet<string>) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const published: LoadoutsSliceState[] = [];
  bus.on('loadouts', (state) => published.push(state));
  const warnings: string[] = [];
  const persistence = new PersistenceController({
    adapter,
    knownActions: new Set(),
    knownWeapons,
    now: () => 0,
    warn: (text) => warnings.push(text),
  });
  await persistence.open();
  const controller = new LoadoutController({
    bus,
    logger: new NullLogger(),
    options: OPTIONS,
    persistence,
  });
  await controller.start();
  return { bus, controller, published, warnings };
}

const flush = async (): Promise<void> => {
  for (let turn = 0; turn < 10; turn += 1) await Promise.resolve();
};

describe('LoadoutController over PersistenceController', () => {
  it('saves a loadout and loads the identical one in a fresh session', async () => {
    const adapter = new MemoryStorageAdapter(); // one page's storage; each session opens it again
    const known = new Set(['raptor-talons', 'wuuthrad']);
    const first = await started(adapter, known);
    first.bus.emit('ui-intent', {
      kind: 'save-loadout',
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });
    await flush();
    first.controller.destroy();

    const second = await started(adapter, known);
    expect(second.published[0]?.saved).toEqual({ warrior: 'wuuthrad' });
    expect(second.published[0]?.repaired).toEqual([]);
  });

  it('starts from the class default when the saved weapon is no longer in content', async () => {
    const adapter = new MemoryStorageAdapter(); // one page's storage; each session opens it again
    const first = await started(adapter, new Set(['raptor-talons', 'wuuthrad']));
    first.bus.emit('ui-intent', {
      kind: 'save-loadout',
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });
    await flush();
    first.controller.destroy();

    const second = await started(adapter, new Set(['raptor-talons']));
    expect(second.published[0]?.saved).toEqual({});
    expect(second.warnings.length).toBeGreaterThan(0);
  });
});
