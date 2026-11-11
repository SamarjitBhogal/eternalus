import { createDefaultGameConfig } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { snapshotAtTick } from './duel/__fixtures__/snapshots';
import { FakeMessageTransport } from './engine/net/FakeMessageTransport';
import { FakeRunningMatch } from './FakeRunningMatch';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { prepareMatchWorld } from './prepareMatchWorld';
import type { DuelMatchRequest } from './SessionController.types';
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
async function setUp() {
  const transports: FakeMessageTransport[] = [];
  const requests: DuelMatchRequest[] = [];
  const matches: FakeRunningMatch[] = [];
  const seeds: number[] = [];
  const session = testSession({
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
    session.intent({ kind: 'start-duel' });
    transport().receive({
      type: 'match-found',
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

    session.intent({ kind: 'start-duel' });

    expect(session.transport().sent).toEqual([{ type: 'queue-join' }]);
    expect(route(session)).toBe('duel-queue');
    expect(session.controller.phase).toBe('menu');
  });

  it('leaves the queue on cancel-duel and shows home', async () => {
    const session = await setUp();
    session.intent({ kind: 'start-duel' });

    session.intent({ kind: 'cancel-duel' });

    expect(session.transport().sent).toEqual([{ type: 'queue-join' }, { type: 'queue-leave' }]);
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

  it('shows the results from the own team when the server ends the match, then returns to the menu', async () => {
    const session = await setUp();
    await session.startDuel();
    session.controller.attachViewport(VIEWPORT);

    session.transport().receive({ type: 'match-ended', reason: 'finished', winner: 'dark' });

    expect(session.controller.phase).toBe('results');
    expect(session.store.getState().match.result).toEqual({
      winner: 'dark',
      reason: 'finished',
      ownTeam: 'dark',
    });
    session.intent({ kind: 'navigate', route: 'home' });
    expect(session.controller.phase).toBe('menu');
    expect(session.transport().hasEnded).toBe(true);
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
    session.intent({ kind: 'start-duel' });
    session.transport().receive({
      type: 'match-found',
      matchId: 'm',
      seed: 1234,
      team: 'dark',
      legendId: 'entity-7',
    });
    session.transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });
    expect(session.controller.phase).toBe('match-loading');

    session.transport().receive({ type: 'match-ended', reason: 'opponent-left', winner: 'dark' });

    expect(session.controller.phase).toBe('results');
    expect(session.store.getState().match.result).toEqual({
      winner: 'dark',
      reason: 'opponent-left',
      ownTeam: 'dark',
    });
    expect(session.store.getState().session.reason).toBeNull();
  });

  it('shows home when the opponent leaves between pairing and the first snapshot', async () => {
    const session = await setUp();
    session.intent({ kind: 'start-duel' });
    session.transport().receive({
      type: 'match-found',
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
    session.intent({ kind: 'start-duel' });

    session.transport().drop();

    expect(route(session)).toBe('home');
    expect(session.controller.phase).toBe('menu');
  });
});
