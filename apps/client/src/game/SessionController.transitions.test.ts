import { describe, expect, it } from 'vitest';

import { type BridgeEventMap, SESSION_PHASES, type SessionPhase } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { SessionController } from './SessionController';
import type { SessionContext, SessionState } from './SessionController.types';
import { IllegalSessionTransition } from './session/IllegalSessionTransition';
import { testSessionDeps } from './testSessionDeps';

// Architecture 13 §2, written out independently of SESSION_TRANSITIONS.
const LEGAL: readonly (readonly [SessionPhase, SessionPhase])[] = [
  ['boot', 'menu'],
  ['menu', 'loading'],
  ['loading', 'character-select'],
  ['loading', 'menu'],
  ['character-select', 'pre-launch'],
  ['character-select', 'menu'],
  ['pre-launch', 'match-loading'],
  ['match-loading', 'match'],
  ['match-loading', 'menu'],
  ['match', 'results'],
  ['match', 'menu'],
  ['results', 'menu'],
  ['results', 'loading'],
];

describe('SessionController transition table', () => {
  /** Fake states that only capture the context, so the test drives every transition. */
  function withFakeStates() {
    const captured: { context: SessionContext | null } = { context: null };
    const fake = (phase: SessionPhase): SessionState => ({
      phase,
      enter: (context) => {
        captured.context = context;
      },
    });
    const states = Object.fromEntries(
      SESSION_PHASES.map((phase) => [phase, fake(phase)]),
    ) as Record<SessionPhase, SessionState>;
    const bus = new TypedEventBus<BridgeEventMap>();
    const phases: SessionPhase[] = [];
    bus.on('session-phase', ({ phase }) => phases.push(phase));
    const controller = new SessionController(testSessionDeps({ bus, states }));
    controller.start();
    const context = captured.context;
    if (context === null) throw new Error('boot did not enter');
    return { controller, phases, context, bus };
  }

  // SESSION_PHASES is in flow order, so each phase is reachable through the ones before it.
  const pathTo = (phase: SessionPhase): SessionPhase[] =>
    SESSION_PHASES.slice(1, SESSION_PHASES.indexOf(phase) + 1);

  const pairs = SESSION_PHASES.flatMap((from) => SESSION_PHASES.map((to) => [from, to] as const));
  const isLegal = ([from, to]: readonly [SessionPhase, SessionPhase]): boolean =>
    LEGAL.some(([a, b]) => a === from && b === to);

  for (const [from, to] of pairs.filter(isLegal)) {
    it(`${from} → ${to} is legal`, () => {
      const { context, controller, phases } = withFakeStates();
      for (const step of pathTo(from)) context.transition(step);
      expect(controller.phase).toBe(from);
      context.transition(to);
      expect(controller.phase).toBe(to);
      expect(phases.at(-1)).toBe(to);
    });
  }

  for (const [from, to] of pairs.filter((pair) => !isLegal(pair))) {
    it(`${from} → ${to} is illegal and throws`, () => {
      const { context, controller } = withFakeStates();
      for (const step of pathTo(from)) context.transition(step);
      expect(() => {
        context.transition(to);
      }).toThrow(new IllegalSessionTransition(from, to));
      expect(controller.phase).toBe(from);
    });
  }

  // A screen crash leaves every phase but `menu` and `match` for the menu (DEC-149), outside the
  // intent table; the test drives it as the session is driven, through the `ui-intent` bus. In
  // `match` the same intent ends the match instead (`SessionController.crash.test.ts`).
  const SCREEN_CRASH = {
    kind: 'report-screen-crash',
    screen: 'screen',
    message: 'render failed',
    stack: '',
    componentStack: '',
  } as const;
  const crashingPhases = SESSION_PHASES.filter((phase) => phase !== 'menu' && phase !== 'match');
  for (const from of crashingPhases) {
    it(`a screen crash in ${from} reaches the menu with screen-crashed, outside the intent table (DEC-149)`, () => {
      const { context, controller, bus } = withFakeStates();
      const moves: BridgeEventMap['session-phase'][] = [];
      bus.on('session-phase', (move) => moves.push(move));
      for (const step of pathTo(from)) context.transition(step);

      bus.emit('ui-intent', SCREEN_CRASH);

      expect(controller.phase).toBe('menu');
      expect(moves.at(-1)).toMatchObject({ phase: 'menu', reason: 'screen-crashed' });
    });
  }

  it('keeps a screen crash in menu in menu: it shows the reason again, with no move', () => {
    const { context, controller, bus } = withFakeStates();
    context.transition('menu');
    const moves: SessionPhase[] = [];
    bus.on('session-phase', ({ phase }) => moves.push(phase));

    bus.emit('ui-intent', SCREEN_CRASH);

    expect(controller.phase).toBe('menu');
    expect(moves).toEqual(['menu']);
  });

  it('cannot repeat a match setup that was never made', () => {
    const { context } = withFakeStates();
    expect(() => {
      context.repeatMatchSetup();
    }).toThrow('No match setup to repeat');
  });

  it('refuses to transition after destroy', () => {
    const { context, controller } = withFakeStates();
    controller.destroy();
    expect(controller.phase).toBeNull();
    expect(() => {
      context.transition('menu');
    }).toThrow('Session is not running');
  });
});
