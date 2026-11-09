import {
  createDefaultGameConfig,
  type EntitySnapshot,
  type InputIntent,
  NullLogger,
  Simulation,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { type PlayerChoice, withPlayer } from './__fixtures__/withPlayer';
import { Camera } from './engine/Camera';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import type { IntentSource } from './Match.types';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';
import { HEALTH_BAR_FILL_COLORS } from './views/entityViews.constants';
import type { HealthBarSide } from './views/EntityLayer.types';

const SEED = 1;
const PLAYER: PlayerChoice = { legend: 'warrior', team: 'light' };

/** The most ticks the test waits for the player's first hit to land (10 s). */
const MAX_FIGHT_TICKS = 300;

/** A player who never touches the controls: the test sends its commands to the simulation. */
const IDLE: IntentSource = {
  read: (): InputIntent => ({ move: { x: 0, y: 0 }, aim: null, triggered: [] }),
};

/** A match on seed 1's world, no countdown, whose player is a Light Warrior. */
const setUp = () => {
  const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
  const world = prepareMatchWorld(config, SEED);
  const simulation = new Simulation({
    seed: SEED,
    logger: new NullLogger(),
    ...withPlayer(config, PLAYER),
    map: world.map,
  });
  const renderer = new RecordingRenderer();
  const match = new Match({
    simulation,
    world,
    tickRate: config.tickRate,
    scheduler: new FakeFrameScheduler(),
    renderer,
    camera: new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT),
    input: IDLE,
    logger: new NullLogger(),
    onCrash: () => undefined,
    bridge: {
      bus: new TypedEventBus<BridgeEventMap>(),
      publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
      captureKinds: [],
    },
  });
  match.resize(1280, 720, 1);
  return { match, simulation, renderer };
};

/** How many health bars of `side` the last frame filled. */
const barsDrawn = (renderer: RecordingRenderer, side: HealthBarSide): number =>
  renderer.calls.filter(
    (call) => call.op === 'fillPolygon' && call.args[1] === HEALTH_BAR_FILL_COLORS[side],
  ).length;

describe('Match health bars (DEC-195)', () => {
  it("shows an enemy Legend's bar once the player's attack hurts it, never the player's own", () => {
    // A dark Warrior spawned next to the player (no controller, so it never attacks first).
    const { match, simulation, renderer } = setUp();
    const player = match.snapshot.entities.find(({ id }) => id === match.playerEntityId);
    const at = player?.transform;
    if (player === undefined || at === null || at === undefined) throw new Error('No player');
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'dark',
      at: { x: at.x + at.radius + 0.5, y: at.y },
      count: 1,
    });
    match.tick();
    const enemy = (): EntitySnapshot | undefined =>
      match.snapshot.entities.find(({ team, family }) => team === 'dark' && family === 'legend');
    const enemyId = enemy()?.id;
    if (enemyId === undefined) throw new Error('No enemy spawned');

    match.render(0);
    expect(barsDrawn(renderer, 'enemy')).toBe(0);

    simulation.enqueueCommand({ type: 'attack-target', actorId: player.id, targetId: enemyId });
    let ticks = 0;
    const isHurt = () => (enemy()?.health?.current ?? 0) < (enemy()?.health?.max ?? 0);
    while (!isHurt() && ticks < MAX_FIGHT_TICKS) {
      match.tick();
      ticks += 1;
    }
    expect(isHurt()).toBe(true);

    renderer.calls.length = 0;
    match.render(0);
    expect(barsDrawn(renderer, 'enemy')).toBe(1);
    // The player fought too (its hit landed on a unit), but the HUD shows its health, not a bar.
    expect(barsDrawn(renderer, 'ally')).toBe(0);
    match.destroy();
  });
});
