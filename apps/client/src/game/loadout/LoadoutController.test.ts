import { loadDisplayContent, loadoutContentOf, MemoryLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../../bridge/events';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import { TypedEventBus } from '../../bridge/TypedEventBus';
import { LoadoutController } from './LoadoutController';

const WARRIOR_OPTIONS = {
  classId: 'warrior',
  defaultWeaponId: 'raptor-talons',
  weapons: [
    { id: 'raptor-talons', displayName: 'Raptor Talons' },
    { id: 'wuuthrad', displayName: 'Wuuthrad' },
  ],
};

/** Two Legends of the warrior class, each keeping its own loadout (DEC-354 (1)). */
const OPTIONS: LoadoutsSliceState['options'] = {
  knight: WARRIOR_OPTIONS,
  paladin: WARRIOR_OPTIONS,
};

/** The shipped loadout rules: the Warrior may carry Raptor Talons or Wuuthrad, not the Staff. */
const CONTENT = loadoutContentOf(loadDisplayContent());

type Saved = { specId: string; primaryWeaponId: string };

type Fake = {
  records: Saved[];
  saved: Saved[];
  asked: string[][];
  failLoad: boolean;
  failSave: boolean;
};

async function started(fake: Fake, options: LoadoutsSliceState['options'] = OPTIONS) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const logger = new MemoryLogger();
  const published: LoadoutsSliceState[] = [];
  bus.on('loadouts', (state) => published.push(state));
  const controller = new LoadoutController({
    bus,
    logger,
    options,
    content: CONTENT,
    persistence: {
      loadLoadouts: (specIds) => {
        fake.asked.push([...specIds]);
        if (fake.failLoad) return Promise.reject(new Error('boom'));
        return Promise.resolve(
          new Map(fake.records.map(({ specId, primaryWeaponId }) => [specId, { primaryWeaponId }])),
        );
      },
      saveLoadout: (specId, loadout) => {
        if (fake.failSave) return Promise.reject(new Error('disk full'));
        fake.saved.push({ specId, primaryWeaponId: loadout.primaryWeaponId });
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

const knightWith = (primaryWeaponId: string): Saved => ({ specId: 'knight', primaryWeaponId });

const saveIntent = (specId: string, primaryWeaponId: string) =>
  ({ kind: 'save-loadout', specId, primaryWeaponId }) as const;

describe('LoadoutController', () => {
  it('asks the repository for exactly the Legends content has', async () => {
    const fake = fakeStore();
    await started(fake);
    expect(fake.asked).toEqual([['knight', 'paladin']]);
  });

  it('publishes the options and the saved loadouts at start', async () => {
    const { published } = await started(fakeStore([knightWith('wuuthrad')]));
    expect(published).toEqual([{ options: OPTIONS, saved: { knight: 'wuuthrad' }, repaired: [] }]);
  });

  it('repairs a saved weapon content no longer has with the auto-build, and logs it', async () => {
    const { published, logger } = await started(fakeStore([knightWith('removed-sword')]));
    expect(published[0]?.saved).toEqual({ knight: 'raptor-talons' });
    expect(published[0]?.repaired).toEqual(['knight']);
    const warning = logger.records.find((record) => record.severityText === 'WARN');
    expect(warning?.body).toBe('a saved loadout broke the loadout rules; auto-build repaired it');
    expect(warning?.attributes).toEqual({ specId: 'knight', slots: 'primary-weapon' });
  });

  it("repairs a saved weapon the Legend's class may not carry the same way", async () => {
    const { published } = await started(fakeStore([knightWith('magus-staff')]));
    expect(published[0]?.saved).toEqual({ knight: 'raptor-talons' });
    expect(published[0]?.repaired).toEqual(['knight']);
  });

  it('starts from the defaults and warns when storage cannot be read', async () => {
    const { published, logger } = await started({ ...fakeStore(), failLoad: true });
    expect(published[0]).toEqual({ options: OPTIONS, saved: {}, repaired: [] });
    expect(logger.records.map((record) => record.severityText)).toEqual(['WARN']);
  });

  it('publishes and saves a loadout the Legend offers, clearing its repair mark', async () => {
    const fake = fakeStore([knightWith('magus-staff')]);
    const { bus, published } = await started(fake);
    bus.emit('ui-intent', saveIntent('knight', 'wuuthrad'));
    expect(published.at(-1)).toEqual({
      options: OPTIONS,
      saved: { knight: 'wuuthrad' },
      repaired: [],
    });
    expect(fake.saved).toEqual([knightWith('wuuthrad')]);
  });

  it('keeps a different weapon for each of two Legends of one class (DEC-354 (1))', async () => {
    const fake = fakeStore([knightWith('wuuthrad')]);
    const { bus, controller, published } = await started(fake);
    bus.emit('ui-intent', saveIntent('paladin', 'raptor-talons'));
    expect(published.at(-1)?.saved).toEqual({ knight: 'wuuthrad', paladin: 'raptor-talons' });
    expect(controller.loadoutOf('knight')?.primaryWeaponId).toBe('wuuthrad');
    expect(controller.loadoutOf('paladin')?.primaryWeaponId).toBe('raptor-talons');
    expect(fake.saved).toEqual([{ specId: 'paladin', primaryWeaponId: 'raptor-talons' }]);
  });

  it("answers a Legend's saved loadout as its class's core loadout, or null", async () => {
    const { bus, controller } = await started(fakeStore());
    expect(controller.loadoutOf('knight')).toBeNull();

    bus.emit('ui-intent', saveIntent('knight', 'wuuthrad'));

    expect(controller.loadoutOf('knight')).toEqual({
      classId: 'warrior',
      primaryWeaponId: 'wuuthrad',
    });
    expect(controller.loadoutOf('paladin')).toBeNull();
    expect(controller.loadoutOf(null)).toBeNull();
    expect(controller.loadoutOf('old-legend')).toBeNull();
  });

  it("refuses a weapon the Legend's class may not carry: nothing is published or saved", async () => {
    const fake = fakeStore();
    const { bus, published, logger } = await started(fake);
    bus.emit('ui-intent', saveIntent('knight', 'magus-staff'));
    expect(published).toHaveLength(1);
    expect(fake.saved).toEqual([]);
    expect(logger.records.at(-1)).toMatchObject({
      severityText: 'WARN',
      attributes: {
        specId: 'knight',
        problems: 'class "warrior" may not carry weapon "magus-staff"',
      },
    });
  });

  it('refuses a save for a Legend content does not have, at WARN', async () => {
    const fake = fakeStore();
    const { bus, published, logger } = await started(fake);
    bus.emit('ui-intent', saveIntent('warrior', 'wuuthrad'));
    expect(published).toHaveLength(1);
    expect(fake.saved).toEqual([]);
    expect(logger.records.at(-1)).toMatchObject({
      severityText: 'WARN',
      body: 'a loadout was not saved: the Legend does not exist',
      attributes: { specId: 'warrior', primaryWeaponId: 'wuuthrad' },
    });
  });

  it('lists every violation validateLoadout finds when it refuses a pick', async () => {
    const fake = fakeStore();
    const { bus, logger } = await started(fake, {
      ...OPTIONS,
      'lost-legend': { classId: 'harbinger', defaultWeaponId: 'nope', weapons: [] },
    });
    bus.emit('ui-intent', saveIntent('lost-legend', 'nope'));
    expect(fake.saved).toEqual([]);
    expect(logger.records.at(-1)?.attributes).toEqual({
      specId: 'lost-legend',
      classId: 'harbinger',
      primaryWeaponId: 'nope',
      problems: 'class "harbinger" does not exist; weapon "nope" does not exist',
    });
  });

  it('reports a failed save as an error and keeps the published choice', async () => {
    const fake = { ...fakeStore(), failSave: true };
    const { bus, published, logger } = await started(fake);
    bus.emit('ui-intent', saveIntent('knight', 'wuuthrad'));
    await Promise.resolve();
    await Promise.resolve();
    expect(published.at(-1)?.saved).toEqual({ knight: 'wuuthrad' });
    expect(logger.records.at(-1)?.severityText).toBe('ERROR');
  });

  it('ignores other intents and stops listening after destroy', async () => {
    const fake = fakeStore();
    const { bus, controller, published } = await started(fake);
    bus.emit('ui-intent', { kind: 'navigate', route: 'home' });
    controller.destroy();
    bus.emit('ui-intent', saveIntent('knight', 'wuuthrad'));
    expect(published).toHaveLength(1);
    expect(fake.saved).toEqual([]);
  });
});
