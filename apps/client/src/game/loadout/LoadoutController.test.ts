import { loadDisplayContent, loadoutContentOf, MemoryLogger } from '@eternalus/core';
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

/** The shipped loadout rules: the Warrior may carry Raptor Talons or Wuuthrad, not the Staff. */
const CONTENT = loadoutContentOf(loadDisplayContent());

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
    options: OPTIONS,
    content: CONTENT,
    persistence: {
      loadLoadouts: (classIds) => {
        fake.asked.push([...classIds]);
        if (fake.failLoad) return Promise.reject(new Error('boom'));
        return Promise.resolve(
          new Map(
            fake.records.map(({ classId, primaryWeaponId }) => [classId, { primaryWeaponId }]),
          ),
        );
      },
      saveLoadout: (classId, loadout) => {
        if (fake.failSave) return Promise.reject(new Error('disk full'));
        fake.saved.push({ classId, primaryWeaponId: loadout.primaryWeaponId });
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

  it('repairs a saved weapon content no longer has with the auto-build, and logs it', async () => {
    const { published, logger } = await started(fakeStore([warriorWith('removed-sword')]));
    expect(published[0]?.saved).toEqual({ warrior: 'raptor-talons' });
    expect(published[0]?.repaired).toEqual(['warrior']);
    const warning = logger.records.find((record) => record.severityText === 'WARN');
    expect(warning?.body).toBe('a saved loadout broke the loadout rules; auto-build repaired it');
    expect(warning?.attributes).toEqual({ classId: 'warrior', slots: 'primary-weapon' });
  });

  it('repairs a saved weapon the class may not carry the same way', async () => {
    const { published } = await started(fakeStore([warriorWith('magus-staff')]));
    expect(published[0]?.saved).toEqual({ warrior: 'raptor-talons' });
    expect(published[0]?.repaired).toEqual(['warrior']);
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

  it('answers the saved loadout of a class, or null when none is saved', async () => {
    const { bus, controller } = await started(fakeStore());
    expect(controller.loadoutOf('warrior')).toBeNull();

    bus.emit('ui-intent', {
      kind: 'save-loadout',
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });

    expect(controller.loadoutOf('warrior')).toEqual({
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });
  });

  it('refuses a weapon the class may not carry: nothing is published or saved', async () => {
    const fake = fakeStore();
    const { bus, published, logger } = await started(fake);
    bus.emit('ui-intent', {
      kind: 'save-loadout',
      classId: 'warrior',
      primaryWeaponId: 'magus-staff',
    });
    expect(published).toHaveLength(1);
    expect(fake.saved).toEqual([]);
    expect(logger.records.at(-1)).toMatchObject({
      severityText: 'WARN',
      attributes: { problems: 'class "warrior" may not carry weapon "magus-staff"' },
    });
  });

  it('lists every violation validateLoadout finds when it refuses a pick', async () => {
    const fake = fakeStore();
    const { bus, logger } = await started(fake);
    bus.emit('ui-intent', { kind: 'save-loadout', classId: 'harbinger', primaryWeaponId: 'nope' });
    expect(fake.saved).toEqual([]);
    expect(logger.records.at(-1)?.attributes).toEqual({
      classId: 'harbinger',
      primaryWeaponId: 'nope',
      problems: 'class "harbinger" does not exist; weapon "nope" does not exist',
    });
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
