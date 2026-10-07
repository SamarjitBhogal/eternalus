import { describe, expect, it } from 'vitest';

import { type BridgeEventMap, SESSION_PHASES, type SessionPhase } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { placeholderCatalogue } from './content/placeholderCatalogue';
import { PLACEHOLDER_MATCH_CONFIG } from './content/placeholderSetup';
import { FakeSessionClock } from './engine/time/FakeSessionClock';
import { SessionController } from './SessionController';
import type { SessionContext, SessionState } from './SessionController.types';
import { IllegalSessionTransition } from './session/IllegalSessionTransition';
import { LcgRng } from './session/LcgRng';

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
    const controller = new SessionController({
      bus,
      clock: new FakeSessionClock(),
      states,
      catalogue: placeholderCatalogue,
      matchConfig: PLACEHOLDER_MATCH_CONFIG,
      playerName: 'Tester',
      seedSource: () => 1,
      createRng: (seed) => new LcgRng(seed),
      themeRoot: { dataset: {} },
    });
    controller.start();
    const context = captured.context;
    if (context === null) throw new Error('boot did not enter');
    return { controller, phases, context };
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

  it('refuses to transition after destroy', () => {
    const { context, controller } = withFakeStates();
    controller.destroy();
    expect(controller.phase).toBeNull();
    expect(() => {
      context.transition('menu');
    }).toThrow('Session is not running');
  });
});
