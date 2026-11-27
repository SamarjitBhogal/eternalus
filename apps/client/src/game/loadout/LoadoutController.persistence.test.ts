import {
  type LoadoutContent,
  loadDisplayContent,
  loadoutContentOf,
  MemoryLogger,
} from '@eternalus/core';
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

const DISPLAY = loadDisplayContent();
/** The shipped loadout content. */
const SHIPPED = loadoutContentOf(DISPLAY);
/** The shipped content after a release removed Wuuthrad. */
const WITHOUT_WUUTHRAD = loadoutContentOf({
  legends: DISPLAY.legends,
  weapons: DISPLAY.weapons.filter((weapon) => weapon.id !== 'wuuthrad'),
});

/** A controller over the real facade on shared in-memory storage, as `main.tsx` builds it. */
async function started(adapter: MemoryStorageAdapter, content: LoadoutContent) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const published: LoadoutsSliceState[] = [];
  bus.on('loadouts', (state) => published.push(state));
  const warnings: string[] = [];
  const persistence = new PersistenceController({
    adapter,
    knownActions: new Set(),
    now: () => 0,
    warn: (text) => warnings.push(text),
  });
  await persistence.open();
  const logger = new MemoryLogger();
  const controller = new LoadoutController({ bus, logger, options: OPTIONS, content, persistence });
  await controller.start();
  return { bus, controller, published, warnings, logger };
}

const flush = async (): Promise<void> => {
  for (let turn = 0; turn < 10; turn += 1) await Promise.resolve();
};

describe('LoadoutController over PersistenceController', () => {
  it('saves a loadout and loads the identical one in a fresh session', async () => {
    const adapter = new MemoryStorageAdapter(); // one page's storage; each session opens it again
    const first = await started(adapter, SHIPPED);
    first.bus.emit('ui-intent', {
      kind: 'save-loadout',
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });
    await flush();
    first.controller.destroy();

    const second = await started(adapter, SHIPPED);
    expect(second.published[0]?.saved).toEqual({ warrior: 'wuuthrad' });
    expect(second.published[0]?.repaired).toEqual([]);
  });

  it('repairs a saved weapon a later release removed with the auto-build, and logs it', async () => {
    const adapter = new MemoryStorageAdapter(); // one page's storage; each session opens it again
    const first = await started(adapter, SHIPPED);
    first.bus.emit('ui-intent', {
      kind: 'save-loadout',
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });
    await flush();
    first.controller.destroy();

    const second = await started(adapter, WITHOUT_WUUTHRAD);
    expect(second.published[0]?.saved).toEqual({ warrior: 'raptor-talons' });
    expect(second.published[0]?.repaired).toEqual(['warrior']);
    expect(second.logger.records.map(({ body }) => body)).toEqual([
      'a saved loadout broke the loadout rules; auto-build repaired it',
    ]);
    expect(second.warnings).toEqual([]);
  });
});
