import { describe, expect, it } from 'vitest';

import { classCardFixture, specCardFixture } from '../../../bridge/catalogueFixtures';
import type { ClassSelection, UiIntent } from '../../../bridge/events';
import { coreCatalogue } from '../../content/coreCatalogue';
import { testSession, testSessionDeps } from '../../testSessionDeps';
import { SELECT_COUNTDOWN_MS } from '../sessionTiming.constants';

/**
 * A class with no selectable Legend, a class with an available and a locked Legend, and a locked
 * class, over the shipped catalogue.
 */
const CATALOGUE = {
  ...coreCatalogue.load(),
  legendClasses: [
    classCardFixture({
      classId: 'warrior',
      specs: [specCardFixture({ specId: 'sealed-warrior', status: 'locked' })],
    }),
    classCardFixture({
      classId: 'magus',
      specs: [
        specCardFixture({ specId: 'oracle' }),
        specCardFixture({ specId: 'sealed', status: 'locked' }),
      ],
    }),
    classCardFixture({ classId: 'flying', status: 'locked' }),
  ],
};

/** The real states at character select (every load synchronous), recording each pick. */
function atCharacterSelect() {
  const session = testSession({
    catalogue: { load: () => CATALOGUE },
    resources: testSessionDeps().resources,
  });
  const picks: (ClassSelection | null)[] = [];
  const remaining: number[] = [];
  session.bus.on('class-selection', (selection) => picks.push(selection));
  session.bus.on('countdown', ({ remainingMs }) => remaining.push(remainingMs));
  session.controller.start();
  session.intent({ kind: 'start-match' });
  const send = (...intents: readonly UiIntent[]): void => {
    for (const intent of intents) session.intent(intent);
  };
  return { ...session, picks, remaining, send };
}

describe('CharacterSelectState', () => {
  it('starts with no selection', () => {
    const { controller, store, picks } = atCharacterSelect();
    expect(controller.phase).toBe('character-select');
    expect(store.getState().matchSetup.selection).toEqual({ classId: null, specId: null });
    expect(picks).toEqual([]);
  });

  it('records a selectable class, and an available Legend of it', () => {
    const { picks, send } = atCharacterSelect();
    send(
      { kind: 'select-class', classId: 'magus' },
      { kind: 'select-class', classId: 'magus', specId: 'oracle' },
    );
    expect(picks).toEqual([
      { classId: 'magus', specId: null },
      { classId: 'magus', specId: 'oracle' },
    ]);
  });

  it("ignores a locked class, an unknown class, a locked Legend and another class's Legend", () => {
    const { picks, send } = atCharacterSelect();
    send(
      { kind: 'select-class', classId: 'flying' },
      { kind: 'select-class', classId: 'unknown-class' },
      { kind: 'select-class', classId: 'magus', specId: 'sealed' },
      { kind: 'select-class', classId: 'warrior', specId: 'oracle' },
    );
    expect(picks).toEqual([]);
  });

  it('clears the pick on Back, and Back with nothing picked publishes nothing', () => {
    const { store, picks, send } = atCharacterSelect();
    send({ kind: 'clear-class-selection' });
    expect(picks).toEqual([]);
    send({ kind: 'select-class', classId: 'magus' }, { kind: 'clear-class-selection' });
    expect(picks).toEqual([{ classId: 'magus', specId: null }, null]);
    expect(store.getState().matchSetup.selection).toEqual({ classId: null, specId: null });
  });

  it('stays on confirm with no pick, or a class whose Legend is not picked yet', () => {
    const { controller, send } = atCharacterSelect();
    send({ kind: 'confirm-selection' });
    expect(controller.phase).toBe('character-select');
    send({ kind: 'select-class', classId: 'magus' }, { kind: 'confirm-selection' });
    expect(controller.phase).toBe('character-select');
  });

  it('confirms a picked Legend', () => {
    const { controller, send } = atCharacterSelect();
    send(
      { kind: 'select-class', classId: 'magus', specId: 'oracle' },
      { kind: 'confirm-selection' },
    );
    expect(controller.phase).toBe('pre-launch');
  });

  it('confirms a class with no selectable Legend', () => {
    const { controller, send } = atCharacterSelect();
    send({ kind: 'select-class', classId: 'warrior' }, { kind: 'confirm-selection' });
    expect(controller.phase).toBe('pre-launch');
  });

  it('goes to pre-launch at the timeout with a class and no Legend, to the menu with none', () => {
    const picked = atCharacterSelect();
    picked.send({ kind: 'select-class', classId: 'magus' });
    picked.clock.advance(SELECT_COUNTDOWN_MS);
    expect(picked.controller.phase).toBe('pre-launch');

    const none = atCharacterSelect();
    none.clock.advance(SELECT_COUNTDOWN_MS);
    expect(none.controller.phase).toBe('menu');
    expect(none.store.getState().session.reason).toBe('select-timeout');
  });

  it('keeps one countdown across a pick, Back and a new pick (TAP-11)', () => {
    const { controller, clock, remaining, send } = atCharacterSelect();
    clock.advance(20_000);
    send({ kind: 'select-class', classId: 'magus' });
    clock.advance(10_000);
    send({ kind: 'clear-class-selection' });
    clock.advance(10_000);
    send({ kind: 'select-class', classId: 'warrior' });

    expect(remaining.at(-1)).toBe(20_000);
    expect(remaining.every((ms) => ms % 1_000 === 0)).toBe(true);
    clock.advance(19_999);
    expect(controller.phase).toBe('character-select');
    clock.advance(1);
    expect(controller.phase).toBe('pre-launch');
  });

  it('times out to the menu at exactly 60 s after Back with no new pick', () => {
    const { controller, clock, store, send } = atCharacterSelect();
    clock.advance(20_000);
    send({ kind: 'select-class', classId: 'magus' });
    clock.advance(10_000);
    send({ kind: 'clear-class-selection' });
    clock.advance(29_999);
    expect(controller.phase).toBe('character-select');
    clock.advance(1);
    expect(controller.phase).toBe('menu');
    expect(store.getState().session.reason).toBe('select-timeout');
  });
});
