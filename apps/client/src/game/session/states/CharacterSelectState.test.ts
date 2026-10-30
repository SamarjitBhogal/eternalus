import { describe, expect, it } from 'vitest';

import { classCardFixture, specCardFixture } from '../../../bridge/__fixtures__/catalogueFixtures';
import type { DisplayCatalogue } from '../../../bridge/catalogue.types';
import type { ClassSelection, FilledRosters, UiIntent } from '../../../bridge/events';
import { selectLegendStepView } from '../../../bridge/selectors/selectLegendStepView';
import {
  catalogueWithUnselectableLegend,
  shippedCatalogue,
} from '../../content/__fixtures__/shippedCatalogue';
import { FakeSessionContext } from '../../FakeSessionContext';
import { testSession, testSessionDeps } from '../../testSessionDeps';
import { SELECT_COUNTDOWN_MS } from '../sessionTiming.constants';
import { CharacterSelectState } from './CharacterSelectState';

const SHIPPED = shippedCatalogue().load();

/**
 * A class with no selectable Legend, a class with an available and a locked Legend, and a locked
 * class, over the shipped catalogue, with lane bots of its two playable classes.
 */
const CATALOGUE = {
  ...SHIPPED,
  botRoster: {
    ...SHIPPED.botRoster,
    laners: ['warrior', 'warrior', 'warrior', 'magus', 'magus', 'magus', 'magus', 'magus', 'magus'],
  },
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
    classCardFixture({ classId: 'harbinger', status: 'locked' }),
  ],
};

/** The real states at character select (every load synchronous), recording each pick. */
function atCharacterSelect(catalogue: DisplayCatalogue = CATALOGUE) {
  const session = testSession({
    catalogue: { load: () => catalogue },
    resources: testSessionDeps().resources,
  });
  const picks: (ClassSelection | null)[] = [];
  const remaining: number[] = [];
  const locks: FilledRosters[] = [];
  session.bus.on('class-selection', (selection) => picks.push(selection));
  session.bus.on('countdown', ({ remainingMs }) => remaining.push(remainingMs));
  session.bus.on('selection-locked', (rosters) => locks.push(rosters));
  session.controller.start();
  session.intent({ kind: 'start-match' });
  const send = (...intents: readonly UiIntent[]): void => {
    for (const intent of intents) session.intent(intent);
  };
  return { ...session, picks, remaining, locks, send };
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
      { kind: 'select-class', classId: 'harbinger' },
      { kind: 'select-class', classId: 'unknown-class' },
      { kind: 'select-class', classId: 'magus', specId: 'sealed' },
      { kind: 'select-class', classId: 'warrior', specId: 'oracle' },
    );
    expect(picks).toEqual([]);
  });

  it('logs ERROR naming a class or Legend id the catalogue does not have, then ignores it', () => {
    const { picks, send, logger } = atCharacterSelect();
    send(
      { kind: 'select-class', classId: 'stale-class' },
      { kind: 'select-class', classId: 'magus', specId: 'stale-legend' },
    );
    expect(picks).toEqual([]);
    expect(
      logger.records.map(({ severityText, scope, attributes }) => [
        severityText,
        scope,
        attributes,
      ]),
    ).toEqual([
      ['ERROR', 'client.session', { classId: 'stale-class', specId: null }],
      ['ERROR', 'client.session', { classId: 'magus', specId: 'stale-legend' }],
    ]);
    expect(logger.records[0]?.body).toContain('"stale-class"');
    expect(logger.records[1]?.body).toContain('"stale-legend"');
  });

  it('ignores a locked or unselectable pick without logging', () => {
    const { picks, send, logger } = atCharacterSelect();
    send(
      { kind: 'select-class', classId: 'harbinger' },
      { kind: 'select-class', classId: 'magus', specId: 'sealed' },
      { kind: 'select-class', classId: 'warrior', specId: 'oracle' },
    );
    expect(picks).toEqual([]);
    expect(logger.records).toEqual([]);
  });

  it('shows a Legend core content marks unselectable as locked and never locks it in', () => {
    const { catalogue, classId, specId } = catalogueWithUnselectableLegend();
    const { controller, store, picks, send } = atCharacterSelect(catalogue);
    send(
      { kind: 'select-class', classId },
      { kind: 'select-class', classId, specId },
      { kind: 'confirm-selection' },
    );
    expect(picks).toEqual([{ classId, specId: null }]);
    expect(controller.phase).toBe('character-select');
    const view = selectLegendStepView(store.getState());
    expect(view?.legends.find((legend) => legend.specId === specId)?.isAvailable).toBe(false);
    expect(view?.canLockIn).toBe(false);
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

  it('locks in a picked Legend and holds it until the full countdown ends (DEC-60)', () => {
    const { controller, clock, store, send } = atCharacterSelect();
    send(
      { kind: 'select-class', classId: 'magus', specId: 'oracle' },
      { kind: 'confirm-selection' },
    );
    expect(controller.phase).toBe('character-select');
    expect(store.getState().matchSetup.isLockedIn).toBe(true);
    clock.advance(SELECT_COUNTDOWN_MS - 1);
    expect(controller.phase).toBe('character-select');
    clock.advance(1);
    expect(controller.phase).toBe('pre-launch');
  });

  it('locks in a class with no selectable Legend', () => {
    const { controller, clock, send } = atCharacterSelect();
    send({ kind: 'select-class', classId: 'warrior' }, { kind: 'confirm-selection' });
    clock.advance(SELECT_COUNTDOWN_MS);
    expect(controller.phase).toBe('pre-launch');
  });

  it('fills the rosters once, at LOCK IN, with the enemy Rover copying the pick (DEC-61)', () => {
    const { locks, send } = atCharacterSelect();
    send({ kind: 'select-class', classId: 'magus', specId: 'oracle' });
    expect(locks).toEqual([]);
    send({ kind: 'confirm-selection' }, { kind: 'confirm-selection' });
    expect(locks).toHaveLength(1);
    expect(locks[0]?.allies[0]).toMatchObject({
      isPlayer: true,
      classId: 'magus',
      specId: 'oracle',
    });
    expect(locks[0]?.enemies[0]).toMatchObject({
      isRover: true,
      classId: 'magus',
      specId: 'oracle',
    });
  });

  it('ignores every pick, Back, LOCK IN and cancel after LOCK IN (DEC-60)', () => {
    const { controller, picks, store, send } = atCharacterSelect();
    send(
      { kind: 'select-class', classId: 'magus', specId: 'oracle' },
      { kind: 'confirm-selection' },
      { kind: 'select-class', classId: 'warrior' },
      { kind: 'clear-class-selection' },
      { kind: 'cancel-match' },
    );
    expect(picks).toEqual([{ classId: 'magus', specId: 'oracle' }]);
    expect(controller.phase).toBe('character-select');
    expect(store.getState().matchSetup.selection).toEqual({ classId: 'magus', specId: 'oracle' });
  });

  it('starts no match when the countdown ends before LOCK IN, with or without a pick (DEC-102)', () => {
    for (const pick of [
      [],
      [{ kind: 'select-class', classId: 'magus' }],
      [{ kind: 'select-class', classId: 'magus', specId: 'oracle' }],
    ] as const satisfies readonly (readonly UiIntent[])[]) {
      const { controller, clock, locks, store, send } = atCharacterSelect();
      send(...pick);
      clock.advance(SELECT_COUNTDOWN_MS);
      expect(controller.phase).toBe('menu');
      expect(store.getState().session.reason).toBe('select-timeout');
      expect(locks).toEqual([]);
    }
  });

  it('starts every visit unlocked: the state is reused (a rematch)', () => {
    const state = new CharacterSelectState();
    const context = new FakeSessionContext();
    for (const visit of [1, 2]) {
      state.enter(context);
      state.handleIntent({ kind: 'select-class', classId: 'magus', specId: 'oracle' }, context);
      state.handleIntent({ kind: 'confirm-selection' }, context);
      state.exit();
      expect(context.calls.lockIn).toHaveLength(visit);
    }
  });

  it('keeps one countdown across a pick, Back, a new pick and LOCK IN (TAP-11, DEC-60)', () => {
    const { controller, clock, remaining, send } = atCharacterSelect();
    clock.advance(20_000);
    send({ kind: 'select-class', classId: 'magus' });
    clock.advance(10_000);
    send({ kind: 'clear-class-selection' });
    clock.advance(10_000);
    send({ kind: 'select-class', classId: 'warrior' }, { kind: 'confirm-selection' });

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
