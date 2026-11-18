import { NullLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../../bridge/events';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import { TypedEventBus } from '../../bridge/TypedEventBus';
import { MemoryStorageAdapter } from '../../data/persistence/MemoryStorageAdapter';
import { LoadoutRepository } from '../../data/persistence/repositories/LoadoutRepository';
import { STORAGE_SCHEMA } from '../../data/persistence/schema/migrations';
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

/** A controller over the real repository on shared in-memory storage, as `main.tsx` will build it. */
async function started(adapter: MemoryStorageAdapter, knownWeapons: ReadonlySet<string>) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const published: LoadoutsSliceState[] = [];
  bus.on('loadouts', (state) => published.push(state));
  const warnings: string[] = [];
  const controller = new LoadoutController({
    bus,
    logger: new NullLogger(),
    profileId: 'p1',
    options: OPTIONS,
    persistence: new LoadoutRepository(
      adapter,
      knownWeapons,
      () => 0,
      (text) => warnings.push(text),
    ),
  });
  await controller.start();
  return { bus, controller, published, warnings };
}

/** An opened in-memory store with every schema store created, as the persistence layer leaves it. */
async function openAdapter(): Promise<MemoryStorageAdapter> {
  const adapter = new MemoryStorageAdapter();
  await adapter.open(STORAGE_SCHEMA);
  return adapter;
}

const flush = async (): Promise<void> => {
  for (let turn = 0; turn < 10; turn += 1) await Promise.resolve();
};

describe('LoadoutController over LoadoutRepository', () => {
  it('saves a loadout and loads the identical one in a fresh session', async () => {
    const adapter = await openAdapter();
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
    const adapter = await openAdapter();
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
