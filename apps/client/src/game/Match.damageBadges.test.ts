import {
  createDefaultGameConfig,
  type GameEventMap,
  type InputIntent,
  NullLogger,
  Simulation,
  type Snapshot,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { withFirstTickHit } from './__fixtures__/withFirstTickHit';
import { withPlayer } from './__fixtures__/withPlayer';
import { Camera } from './engine/Camera';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import type { IntentSource, MatchDeps } from './Match.types';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';

const SEED = 1;

/** A player who never touches the controls. */
const IDLE: IntentSource = {
  read: (): InputIntent => ({ move: { x: 0, y: 0 }, aim: null, triggered: [] }),
};

type Settings = Pick<MatchDeps, 'settings' | 'isReducedMotion'>;

/** The readers of "show every hit" and of reduced motion, as given. */
const settingsOf = (shouldShowEveryHit: boolean, isReducedMotion = false): Settings => ({
  settings: () => ({ hud: { shouldShowEveryHit } }),
  isReducedMotion: () => isReducedMotion,
});

/** A hit of 7 on the player, from no one. */
const onPlayer = ({ match }: Snapshot): GameEventMap['damage-applied'] | undefined =>
  match.humanLegendId === null
    ? undefined
    : {
        targetId: match.humanLegendId,
        amount: 7,
        absorbed: 0,
        source: { attackerId: null, kind: 'environment', definitionId: 'test-hazard' },
      };

/** A hit of 9 on some other unit that can take damage, from no one: not the player's hit. */
const onOther = ({ entities, match }: Snapshot): GameEventMap['damage-applied'] | undefined => {
  const other = entities.find(
    ({ id, health, transform }) =>
      id !== match.humanLegendId && health !== null && transform !== null,
  );
  return other === undefined
    ? undefined
    : {
        targetId: other.id,
        amount: 9,
        absorbed: 0,
        source: { attackerId: null, kind: 'environment', definitionId: 'test-hazard' },
      };
};

/**
 * A match on seed 1's world (a Light Warrior player, no countdown) whose first step also lands
 * `hitOf`'s hit, run one tick and drawn; returns the numbers the frame drew, with their sizes.
 */
const numbersAfterFirstHit = (
  hitOf: (snapshot: Snapshot) => GameEventMap['damage-applied'] | undefined,
  settings: Settings = {},
) => {
  const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
  const world = prepareMatchWorld(config, SEED);
  const simulation = new Simulation({
    seed: SEED,
    logger: new NullLogger(),
    ...withPlayer(config, { legend: 'warrior', team: 'light' }),
    map: world.map,
  });
  const renderer = new RecordingRenderer();
  const match = new Match({
    simulation: withFirstTickHit(simulation, hitOf),
    world,
    tickRate: config.tickRate,
    scheduler: new FakeFrameScheduler(),
    renderer,
    camera: new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT),
    input: IDLE,
    ...settings,
    logger: new NullLogger(),
    observer: { crashed: () => undefined, ended: () => undefined },
    bridge: {
      bus: new TypedEventBus<BridgeEventMap>(),
      publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
      captureKinds: [],
    },
  });
  match.resize(1280, 720, 1);
  match.tick();
  match.render(0);
  match.destroy();
  return renderer.calls.flatMap((call) =>
    call.op === 'drawText' ? [{ text: call.args[0], size: call.args[2].size }] : [],
  );
};

describe('Match damage numbers (W5, DEC-410)', () => {
  it('draws the number of a hit the player takes on the next frame', () => {
    expect(numbersAfterFirstHit(onPlayer).map(({ text }) => text)).toEqual(['7']);
  });

  it('hides another unit\'s hit by default and shows it with the "show every hit" setting (W5c)', () => {
    expect(numbersAfterFirstHit(onOther)).toEqual([]);
    expect(numbersAfterFirstHit(onOther, settingsOf(false))).toEqual([]);
    expect(numbersAfterFirstHit(onOther, settingsOf(true)).map(({ text }) => text)).toEqual(['9']);
  });

  it('passes reduced motion to the badges: a new badge does not pop', () => {
    const [popping] = numbersAfterFirstHit(onPlayer, settingsOf(false));
    const [still] = numbersAfterFirstHit(onPlayer, settingsOf(false, true));

    expect(still?.size).toBeLessThan(popping?.size ?? 0);
  });
});
