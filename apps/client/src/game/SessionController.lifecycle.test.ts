import { createDefaultGameConfig } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { fakeMatchEvidence } from '../data/logging/__fixtures__/errorReports';
import { firstAvailableSpecId, shippedCatalogue } from './content/__fixtures__/shippedCatalogue';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import type { PreparedWorld } from './Match.types';
import type { MatchViewport } from './MatchViewport.types';
import { prepareMatchWorld } from './prepareMatchWorld';
import type {
  MatchFactory,
  RunningMatch,
  SessionContext,
  SessionControllerDeps,
} from './SessionController.types';
import { createRosterRng } from './session/createRosterRng';
import { rosterSlots } from './session/rosterSlots';
import { createDefaultSessionStates } from './session/defaultSessionStates';
import { MatchState } from './session/states/MatchState';
import { REVEAL_COUNTDOWN_MS, SELECT_COUNTDOWN_MS } from './session/sessionTiming.constants';
import { testSession } from './testSessionDeps';

const CONFIG = createDefaultGameConfig();
/** The Legend these tests pick for the magus class. */
const MAGUS_LEGEND = firstAvailableSpecId('magus');

const CHROME = {
  onDeveloperRoofsChanged: () => undefined,
  onExplorerChanged: () => undefined,
  setOverview: () => undefined,
};

const viewport = (canvas = new FakeViewportCanvas()): MatchViewport => ({
  canvas,
  chrome: CHROME,
  isExplorerShown: false,
});

/** The real match state, keeping its context so a test can end the match into results. */
class ResultsReachableMatchState extends MatchState {
  public context: SessionContext | null = null;

  public override enter(context: SessionContext): void {
    super.enter(context);
    this.context = context;
  }
}

/** A session whose world and match factories are spies; the real match state hands out its context. */
function setUp(overrides: Partial<SessionControllerDeps> = {}) {
  const worlds: PreparedWorld[] = [];
  const prepareWorld = vi.fn((seed: number) => {
    const world = prepareMatchWorld(CONFIG, seed);
    worlds.push(world);
    return world;
  });
  const handles: {
    destroy: ReturnType<typeof vi.fn>;
    setPaused: ReturnType<typeof vi.fn>;
    evidence: ReturnType<typeof vi.fn<typeof fakeMatchEvidence>>;
    currentTick: ReturnType<typeof vi.fn>;
  }[] = [];
  const createMatch = vi.fn<MatchFactory>((): RunningMatch => {
    const handle = {
      destroy: vi.fn(),
      setPaused: vi.fn(),
      evidence: vi.fn(fakeMatchEvidence),
      currentTick: vi.fn(() => 0),
    };
    handles.push(handle);
    return handle;
  });
  const match = new ResultsReachableMatchState();
  const states = { ...createDefaultSessionStates(), match };
  const session = testSession({ prepareWorld, createMatch, states, ...overrides });
  const load = vi.spyOn(session.resources, 'load');
  const toCharacterSelect = async (): Promise<void> => {
    session.controller.start();
    await session.resolveLoads();
    session.intent({ kind: 'start-match' });
    await session.resolveLoads();
  };
  const toMatchLoading = async (): Promise<void> => {
    if (session.controller.phase === null) await toCharacterSelect();
    else {
      session.intent({ kind: 'start-match' });
      await session.resolveLoads();
    }
    session.intent({ kind: 'select-class', classId: 'magus', specId: MAGUS_LEGEND });
    session.intent({ kind: 'confirm-selection' });
    // DEC-60: LOCK IN holds the full select countdown; the reveal follows it.
    session.clock.advance(SELECT_COUNTDOWN_MS);
    session.clock.advance(REVEAL_COUNTDOWN_MS);
  };
  const toMatch = async (): Promise<void> => {
    await toMatchLoading();
    await session.resolveLoads();
  };
  return {
    ...session,
    ...{ worlds, prepareWorld, handles, createMatch, match, load },
    ...{ toCharacterSelect, toMatchLoading, toMatch },
  };
}

describe('SessionController match lifetime', () => {
  it('builds no world and no match before match-loading, and no match before a viewport', async () => {
    const session = setUp();
    await session.toCharacterSelect();
    session.clock.advance(SELECT_COUNTDOWN_MS - 1);
    session.intent({ kind: 'select-class', classId: 'magus', specId: MAGUS_LEGEND });
    session.intent({ kind: 'confirm-selection' });
    session.clock.advance(1);
    session.clock.advance(REVEAL_COUNTDOWN_MS);

    expect(session.controller.phase).toBe('match-loading');
    expect(session.prepareWorld).not.toHaveBeenCalled();
    expect(session.createMatch).not.toHaveBeenCalled();
    expect(session.load.mock.calls.map(([group]) => group)).toEqual([
      'boot',
      'selection',
      'selection-primary',
      'selection-raster',
      'selection-primary-raster',
      'match',
    ]);

    await session.resolveLoads();
    expect(session.controller.phase).toBe('match');
    expect(session.prepareWorld.mock.calls).toEqual([[session.store.getState().matchSetup.seed]]);
    expect(session.createMatch).not.toHaveBeenCalled();
  });

  it("hands the factory the setup, the player's class and team, the world and the viewport", async () => {
    const session = setUp();
    await session.toMatch();
    const attached = viewport();

    session.controller.attachViewport(attached);

    const { seed, playerTeam, allies, enemies } = session.store.getState().matchSetup;
    const [request, passed] = session.createMatch.mock.calls[0] ?? [];
    expect(request?.setup.seed).toBe(seed);
    // The rosters LOCK IN filled: every bot with its Legend, the enemy Rover mirrored (DEC-61).
    expect(request?.setup).toMatchObject({ allies, enemies });
    expect(request?.setup.enemies[0]).toMatchObject({ classId: 'magus', specId: MAGUS_LEGEND });
    // The player's class and team reach the match as the setup's team and the roster's human slot.
    expect(request?.setup.playerTeam).toBe(playerTeam);
    expect(request?.roster.find(({ pilot }) => pilot === 'human')).toMatchObject({
      definitionId: 'magus',
      team: playerTeam,
    });
    expect(request?.world).toBe(session.worlds[0]);
    expect(request?.captureKinds).toEqual(['capture-point', 'cathedral']);
    expect(passed).toBe(attached);
  });

  it("builds the match's roster from the locked rosters and the catalogue's difficulties", async () => {
    const session = setUp();
    await session.toMatch();

    session.controller.attachViewport(viewport());

    const [request] = session.createMatch.mock.calls[0] ?? [];
    expect(request?.roster).not.toHaveLength(0);
    const { difficulties } = shippedCatalogue().load().botRoster;
    expect(request?.roster).toEqual(
      rosterSlots(
        { allies: request?.setup.allies ?? [], enemies: request?.setup.enemies ?? [] },
        difficulties,
      ),
    );
    // The player is the one human slot, on their team; each bot slot's difficulty is its role's,
    // read from the catalogue, not from the helper alone.
    const roster = request?.roster ?? [];
    expect(roster.filter(({ pilot }) => pilot === 'human')).toEqual([
      {
        pilot: 'human',
        team: request?.setup.playerTeam,
        definitionId: 'magus',
        role: 'rover',
        specId: request?.setup.allies.find(({ isPlayer }) => isPlayer)?.specId,
      },
    ]);
    const bots = roster.flatMap((slot) => (slot.pilot === 'bot' ? [slot] : []));
    expect(bots).toHaveLength(roster.length - 1);
    for (const slot of bots) {
      expect(slot.difficulty).toEqual(difficulties[slot.role]);
    }
    expect(difficulties.rover).not.toEqual(difficulties.laner);
  });

  it("draws the bots' Legends at LOCK IN from the injected roster stream of the match seed", async () => {
    const rosterRng = vi.fn(createRosterRng);
    const session = setUp({ createRosterRng: rosterRng });
    await session.toCharacterSelect();
    expect(rosterRng).not.toHaveBeenCalled();

    await session.toMatchLoading();

    expect(rosterRng.mock.calls).toEqual([[session.store.getState().matchSetup.seed]]);
  });

  it('does nothing for a viewport attached outside the match', async () => {
    const session = setUp();
    await session.toCharacterSelect();
    const detach = session.controller.attachViewport(viewport());
    expect(session.createMatch).not.toHaveBeenCalled();
    expect(() => {
      detach();
    }).not.toThrow();
  });

  it('survives StrictMode: attach, detach, attach builds two matches on one world', async () => {
    const session = setUp();
    await session.toMatch();
    const detach = session.controller.attachViewport(viewport());
    detach();
    session.controller.attachViewport(viewport());

    expect(session.createMatch).toHaveBeenCalledTimes(2);
    expect(session.prepareWorld).toHaveBeenCalledTimes(1);
    expect(session.handles[0]?.destroy).toHaveBeenCalledTimes(1);
    expect(session.handles[1]?.destroy).not.toHaveBeenCalled();
    session.intent({ kind: 'leave-match' });
    expect(session.handles[1]?.destroy).toHaveBeenCalledTimes(1);
  });

  it("gives the running match's evidence, and null outside a match (ADR 0025 §3)", async () => {
    const session = setUp();
    expect(session.controller.matchEvidence()).toBeNull();
    await session.toMatch();
    expect(session.controller.matchEvidence()).toBeNull();

    session.controller.attachViewport(viewport());
    const evidence = session.controller.matchEvidence();
    session.intent({ kind: 'leave-match' });

    expect(session.handles[0]?.evidence.mock.results).toEqual([
      { type: 'return', value: evidence },
    ]);
    expect(evidence).toEqual(fakeMatchEvidence());
    expect(session.controller.matchEvidence()).toBeNull();
  });

  it('never ends a newer match on a stale detach', async () => {
    const session = setUp();
    await session.toMatch();
    const detachFirst = session.controller.attachViewport(viewport());
    session.controller.attachViewport(viewport());
    detachFirst();
    expect(session.handles[0]?.destroy).toHaveBeenCalledTimes(1);
    expect(session.handles[1]?.destroy).not.toHaveBeenCalled();
  });

  it('returns to the menu with match-failed and one error when the match cannot be built', async () => {
    const session = setUp();
    session.createMatch.mockImplementationOnce(() => {
      throw new Error('no 2D canvas');
    });
    await session.toMatch();
    const detach = session.controller.attachViewport(viewport());

    expect(session.controller.phase).toBe('menu');
    expect(session.store.getState().session.reason).toBe('match-failed');
    expect(session.logger.records.map(({ severityText, scope }) => [severityText, scope])).toEqual([
      ['ERROR', 'client.session'],
    ]);
    expect(() => {
      detach();
    }).not.toThrow();

    await session.toMatch();
    expect(session.controller.phase).toBe('match');
    expect(session.prepareWorld).toHaveBeenCalledTimes(2);
  });

  it('returns to the menu with match-crashed and one FATAL record when the match crashes (DEC-106)', async () => {
    const session = setUp();
    await session.toMatch();
    session.controller.attachViewport(viewport());
    const seed = session.store.getState().matchSetup.seed;
    const error = new Error('step failed');

    session.createMatch.mock.calls[0]?.[0].onCrash({ error, tick: 42 });

    expect(session.controller.phase).toBe('menu');
    expect(session.store.getState().session.reason).toBe('match-crashed');
    expect(session.handles[0]?.destroy).toHaveBeenCalledTimes(1);
    expect(session.logger.records).toEqual([
      expect.objectContaining({
        severityText: 'FATAL',
        scope: 'client.session',
        body: 'The match stopped because of an error.',
        tick: 42,
        attributes: { error: 'Error: step failed', stack: error.stack ?? null, seed },
      }),
    ]);
  });

  it('returns to the menu with match-failed and builds no match when the world fails', async () => {
    const session = setUp();
    session.prepareWorld.mockImplementationOnce(() => {
      throw new Error('no map');
    });
    await session.toMatch();
    expect(session.controller.phase).toBe('menu');
    expect(session.store.getState().session.reason).toBe('match-failed');
    expect(session.createMatch).not.toHaveBeenCalled();
  });

  it('prepares the world again from the same seed for a rematch', async () => {
    const session = setUp();
    await session.toMatch();
    session.match.context?.transition('results');
    await session.toMatch();
    const seed = session.store.getState().matchSetup.seed;
    expect(session.prepareWorld.mock.calls).toEqual([[seed], [seed]]);
    expect(session.worlds[1]).not.toBe(session.worlds[0]);
  });

  it('destroys the running match when the session is destroyed', async () => {
    const session = setUp();
    await session.toMatch();
    session.controller.attachViewport(viewport());
    session.controller.destroy();
    expect(session.handles[0]?.destroy).toHaveBeenCalledTimes(1);
  });
});
