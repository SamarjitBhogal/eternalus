import { MemoryLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../../bridge/events';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import { TypedEventBus } from '../../bridge/TypedEventBus';
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

type Saved = { classId: string; primaryWeaponId: string };

type Fake = {
  records: Saved[];
  saved: Saved[];
  asked: string[][];
  failLoad: boolean;
  failSave: boolean;
};

async function started(fake: Fake) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const logger = new MemoryLogger();
  const published: LoadoutsSliceState[] = [];
  bus.on('loadouts', (state) => published.push(state));
  const controller = new LoadoutController({
    bus,
    logger,
    profileId: 'p1',
    options: OPTIONS,
    persistence: {
      loadAll: (_profileId, classIds) => {
        fake.asked.push([...classIds]);
        if (fake.failLoad) return Promise.reject(new Error('boom'));
        return Promise.resolve(
          new Map(
            fake.records.map(({ classId, primaryWeaponId }) => [classId, { primaryWeaponId }]),
          ),
        );
      },
      save: (profileId, classId, loadout) => {
        if (fake.failSave) return Promise.reject(new Error('disk full'));
        fake.saved.push({ classId, primaryWeaponId: loadout.primaryWeaponId });
        expect(profileId).toBe('p1');
        return Promise.resolve();
      },
    },
  });
  await controller.start();
  return { bus, controller, logger, published };
}

const fakeStore = (records: Saved[] = []): Fake => ({
  records,
  saved: [],
  asked: [],
  failLoad: false,
  failSave: false,
});

const warriorWith = (primaryWeaponId: string): Saved => ({ classId: 'warrior', primaryWeaponId });

describe('LoadoutController', () => {
  it('asks the repository for exactly the classes content has', async () => {
    const fake = fakeStore();
    await started(fake);
    expect(fake.asked).toEqual([['warrior']]);
  });

  it('publishes the options and the saved loadouts at start', async () => {
    const { published } = await started(fakeStore([warriorWith('wuuthrad')]));
    expect(published).toEqual([{ options: OPTIONS, saved: { warrior: 'wuuthrad' }, repaired: [] }]);
  });

  it('repairs a saved weapon the class does not offer to the default and reports it', async () => {
    const { published, logger } = await started(fakeStore([warriorWith('magus-staff')]));
    expect(published[0]?.saved).toEqual({ warrior: 'raptor-talons' });
    expect(published[0]?.repaired).toEqual(['warrior']);
    const warning = logger.records.find((record) => record.severityText === 'WARN');
    expect(warning?.body).toContain('no longer exists');
    expect(warning?.attributes).toMatchObject({ classId: 'warrior' });
  });

  it('starts from the defaults and warns when storage cannot be read', async () => {
    const { published, logger } = await started({ ...fakeStore(), failLoad: true });
    expect(published[0]).toEqual({ options: OPTIONS, saved: {}, repaired: [] });
    expect(logger.records.map((record) => record.severityText)).toEqual(['WARN']);
  });

  it('publishes and saves a loadout the class offers, clearing its repair mark', async () => {
    const fake = fakeStore([warriorWith('magus-staff')]);
    const { bus, published } = await started(fake);
    bus.emit('ui-intent', {
      kind: 'save-loadout',
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });
    expect(published.at(-1)).toEqual({
      options: OPTIONS,
      saved: { warrior: 'wuuthrad' },
      repaired: [],
    });
    expect(fake.saved).toEqual([warriorWith('wuuthrad')]);
  });

  it('refuses a weapon the class does not offer: nothing is published or saved', async () => {
    const fake = fakeStore();
    const { bus, published, logger } = await started(fake);
    bus.emit('ui-intent', { kind: 'save-loadout', classId: 'warrior', primaryWeaponId: 'nope' });
    expect(published).toHaveLength(1);
    expect(fake.saved).toEqual([]);
    expect(logger.records.at(-1)?.severityText).toBe('WARN');
  });

  it('reports a failed save as an error and keeps the published choice', async () => {
    const fake = { ...fakeStore(), failSave: true };
    const { bus, published, logger } = await started(fake);
    bus.emit('ui-intent', {
      kind: 'save-loadout',
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(published.at(-1)?.saved).toEqual({ warrior: 'wuuthrad' });
    expect(logger.records.at(-1)?.severityText).toBe('ERROR');
  });

  it('ignores other intents and stops listening after destroy', async () => {
    const fake = fakeStore();
    const { bus, controller, published } = await started(fake);
    bus.emit('ui-intent', { kind: 'navigate', route: 'home' });
    controller.destroy();
    bus.emit('ui-intent', {
      kind: 'save-loadout',
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });
    expect(published).toHaveLength(1);
    expect(fake.saved).toEqual([]);
  });
});
