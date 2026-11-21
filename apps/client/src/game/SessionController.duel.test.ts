import { createDefaultGameConfig } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';

import { snapshotAtTick } from './duel/__fixtures__/snapshots';
import { FakeMessageTransport } from './engine/net/FakeMessageTransport';
import { FakeRunningMatch } from './FakeRunningMatch';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { prepareMatchWorld } from './prepareMatchWorld';
import type { DuelMatchRequest, SessionControllerDeps } from './SessionController.types';
import { testSession } from './testSessionDeps';

const CONFIG = createDefaultGameConfig();

const VIEWPORT = {
  canvas: new FakeViewportCanvas(),
  chrome: {
    onDeveloperRoofsChanged: () => undefined,
    onExplorerChanged: () => undefined,
    setOverview: () => undefined,
  },
  isExplorerShown: false,
} as const;

/** A session in `menu` whose Duel transports and Duel matches are recorded. */
async function setUp(overrides: Partial<SessionControllerDeps> = {}) {
  const transports: FakeMessageTransport[] = [];
  const requests: DuelMatchRequest[] = [];
  const matches: FakeRunningMatch[] = [];
  const seeds: number[] = [];
  const session = testSession({
    ...overrides,
    prepareWorld: (seed) => {
      seeds.push(seed);
      return prepareMatchWorld(CONFIG, seed);
    },
    createDuelTransport: () => {
      const transport = new FakeMessageTransport();
      transports.push(transport);
      return transport;
    },
    createDuelMatch: (request) => {
      requests.push(request);
      const match = new FakeRunningMatch();
      matches.push(match);
      return match;
    },
  });
  session.controller.start();
  await session.resolveLoads();
  const transport = (): FakeMessageTransport => {
    const [first] = transports;
    if (first === undefined) throw new Error('No Duel transport was built');
    return first;
  };
  /** The server pairs the player and sends the first snapshot; the assets then load. */
  const startDuel = async (): Promise<void> => {
    session.intent({ kind: 'start-duel', name: 'Ana' });
    transport().receive({
      type: 'match-found',
      opponentName: 'Rival',
      matchId: 'm',
      seed: 1234,
      team: 'dark',
      legendId: 'entity-7',
    });
    transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });
    await session.resolveLoads();
  };
  return { ...session, transports, transport, requests, matches, seeds, startDuel };
}

const route = (session: Awaited<ReturnType<typeof setUp>>): string =>
  session.store.getState().session.menuRoute;

describe('SessionController, online Duel (ADR 0016)', () => {
  it('joins the queue and shows the waiting screen on start-duel, staying in the menu', async () => {
    const session = await setUp();

    session.intent({ kind: 'start-duel', name: 'Ana' });

    expect(session.transport().sent).toEqual([{ type: 'queue-join', name: 'Ana' }]);
    expect(route(session)).toBe('duel-queue');
    expect(session.controller.phase).toBe('menu');
  });

  it('leaves the queue on cancel-duel and shows home', async () => {
    const session = await setUp();
    session.intent({ kind: 'start-duel', name: 'Ana' });

    session.intent({ kind: 'cancel-duel' });

    expect(session.transport().sent).toEqual([
      { type: 'queue-join', name: 'Ana' },
      { type: 'queue-leave' },
    ]);
    expect(session.transport().hasEnded).toBe(true);
    expect(route(session)).toBe('home');
  });

  it('skips selection: the pairing loads the match, then the viewport starts the Duel', async () => {
    const session = await setUp();

    await session.startDuel();
    session.controller.attachViewport(VIEWPORT);

    expect(session.phases).toEqual(['boot', 'menu', 'match-loading', 'match']);
    expect(session.seeds).toEqual([1234]);
    const [request] = session.requests;
    expect(request?.link.legendId).toBe('entity-7');
    expect(request?.world.map).toBeDefined();
  });

  it('shows VERSUS with both names when paired, then loads the match on the first snapshot', async () => {
    const session = await setUp();
    session.intent({ kind: 'start-duel', name: 'Ana' });

    session.transport().receive({
      type: 'match-found',
      opponentName: 'Rival',
      matchId: 'm',
      seed: 1234,
      team: 'dark',
      legendId: 'entity-7',
    });

    expect(route(session)).toBe('duel-versus');
    expect(session.store.getState().match.versus).toEqual({ own: 'Ana', opponent: 'Rival' });
    expect(session.controller.phase).toBe('menu');
    session.transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });
    expect(session.controller.phase).toBe('match-loading');
  });

  it('publishes the seat as the setup team so the HUD selectors work in a Duel', async () => {
    const session = await setUp();

    await session.startDuel();

    expect(session.store.getState().matchSetup.playerTeam).toBe('dark');
  });

  it('publishes the setup before match-loading, while the match group is still loading', async () => {
    const bus = new TypedEventBus<BridgeEventMap>();
    const order: string[] = [];
    bus.on('match-setup', () => order.push('match-setup'));
    bus.on('session-phase', ({ phase }) => order.push(phase));
    const session = await setUp({ bus });
    order.length = 0;
    session.intent({ kind: 'start-duel', name: 'Ana' });
    session.transport().receive({
      type: 'match-found',
      matchId: 'm',
      seed: 1234,
      team: 'dark',
      legendId: 'entity-7',
      opponentName: 'Bo',
    });

    session.transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });

    expect(order).toEqual(['match-setup', 'match-loading']);
    expect(session.store.getState().matchSetup.playerTeam).toBe('dark');
    expect(session.store.getState().matchSetup.mode).toBe('duel');
    expect(session.seeds).toEqual([]);
    await session.resolveLoads();
    expect(session.seeds).toEqual([1234]);
  });

  it('shows the results from the own team when the server ends the match, then returns to the menu', async () => {
    const session = await setUp();
    await session.startDuel();
    session.controller.attachViewport(VIEWPORT);

    session.transport().receive({ type: 'match-ended', reason: 'finished', winner: 'dark' });

    expect(session.controller.phase).toBe('results');
    expect(session.store.getState().match.duel).toEqual({
      winner: 'dark',
      reason: 'finished',
    });
    session.intent({ kind: 'navigate', route: 'home' });
    expect(session.controller.phase).toBe('menu');
    expect(session.transport().hasEnded).toBe(true);
  });

  it('publishes both names and the final score from the last snapshot when the Duel ends (SCRUM-449)', async () => {
    const session = await setUp();
    await session.startDuel();
    session.controller.attachViewport(VIEWPORT);
    const last = snapshotAtTick(2);
    const duel = { kills: { light: 6, dark: 10 }, killTarget: 10 };
    session.transport().receive({
      type: 'state',
      snapshot: { ...last, match: { ...last.match, duel } },
      ackSeq: 0,
    });

    session.transport().receive({ type: 'match-ended', reason: 'finished', winner: 'dark' });

    const { match } = session.store.getState();
    expect(match.versus).toEqual({ own: 'Ana', opponent: 'Rival' });
    expect(match.duelHud).toEqual({
      ownKills: 10,
      opponentKills: 6,
      killTarget: 10,
      countdown: null,
    });
  });

  it('does not report the socket close the server starts after match-ended as a lost connection', async () => {
    const session = await setUp();
    await session.startDuel();
    session.controller.attachViewport(VIEWPORT);

    session.transport().receive({ type: 'match-ended', reason: 'finished', winner: 'light' });
    session.transport().drop();

    expect(session.controller.phase).toBe('results');
    expect(session.store.getState().session.reason).toBeNull();
    expect(session.transport().hasEnded).toBe(true);
  });

  it('ends the match with its result when match-ended arrives during match-loading', async () => {
    const session = await setUp();
    session.intent({ kind: 'start-duel', name: 'Ana' });
    session.transport().receive({
      type: 'match-found',
      opponentName: 'Rival',
      matchId: 'm',
      seed: 1234,
      team: 'dark',
      legendId: 'entity-7',
    });
    session.transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });
    expect(session.controller.phase).toBe('match-loading');

    session.transport().receive({ type: 'match-ended', reason: 'opponent-left', winner: 'dark' });

    expect(session.controller.phase).toBe('results');
    expect(session.store.getState().match.duel).toEqual({
      winner: 'dark',
      reason: 'opponent-left',
    });
    expect(session.store.getState().session.reason).toBeNull();
  });

  it("keeps the results on start-match after a Duel: its setup is the server's and not repeatable", async () => {
    const session = await setUp();
    await session.startDuel();
    session.controller.attachViewport(VIEWPORT);
    session.transport().receive({ type: 'match-ended', reason: 'finished', winner: 'dark' });

    session.intent({ kind: 'start-match' });

    expect(session.controller.phase).toBe('results');
  });

  it("keeps the results on start-match after a Duel that ended while loading: its setup is a Duel's and not repeatable", async () => {
    const session = await setUp();
    session.intent({ kind: 'start-duel', name: 'Ana' });
    session.transport().receive({
      type: 'match-found',
      matchId: 'm',
      seed: 1234,
      team: 'dark',
      legendId: 'entity-7',
      opponentName: 'Bo',
    });
    session.transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });
    session.transport().receive({ type: 'match-ended', reason: 'opponent-left', winner: 'dark' });

    expect(() => {
      session.intent({ kind: 'start-match' });
    }).not.toThrow();
    expect(session.controller.phase).toBe('results');
  });

  it('shows home when the opponent leaves between pairing and the first snapshot', async () => {
    const session = await setUp();
    session.intent({ kind: 'start-duel', name: 'Ana' });
    session.transport().receive({
      type: 'match-found',
      opponentName: 'Rival',
      matchId: 'm',
      seed: 1234,
      team: 'dark',
      legendId: 'entity-7',
    });

    session.transport().receive({ type: 'match-ended', reason: 'opponent-left', winner: 'dark' });

    expect(session.controller.phase).toBe('menu');
    expect(route(session)).toBe('home');
    expect(session.transport().hasEnded).toBe(true);
  });

  it('returns to the menu with a banner when the connection drops during the match', async () => {
    const session = await setUp();
    await session.startDuel();
    session.controller.attachViewport(VIEWPORT);

    session.transport().drop();

    expect(session.controller.phase).toBe('menu');
    expect(session.store.getState().session.reason).toBe('duel-unavailable');
    expect(session.matches[0]?.destroyCount).toBe(1);
  });

  it('shows home again when the connection drops in the queue', async () => {
    const session = await setUp();
    session.intent({ kind: 'start-duel', name: 'Ana' });

    session.transport().drop();

    expect(route(session)).toBe('home');
    expect(session.controller.phase).toBe('menu');
  });
});
