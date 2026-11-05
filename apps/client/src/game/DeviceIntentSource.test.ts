import { createDefaultGameConfig, MemoryLogger, NullLogger, Simulation } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { Camera } from './engine/Camera';
import { fakeKeyEvent } from './engine/input/fakeKeyEvent';
import type { InputDevice, MutableInputSnapshot } from './engine/input/InputDevice.types';
import type { Projection } from './engine/input/Projection.types';
import { KeyboardDevice } from './engine/input/KeyboardDevice';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { DeviceIntentSource } from './DeviceIntentSource';
import { InputMapper } from './input/InputMapper';
import { PRESETS } from './input/keybindings';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import type { PlayerChoice } from './Match.types';
import { prepareMatchWorld } from './prepareMatchWorld';
import { seatedConfig } from './seatedConfig';

const PLAYER: PlayerChoice = { legend: 'warrior', team: 'light' };
const IDENTITY: Projection = { screenToWorld: (point) => point };

/** A device that always holds the same keys and counts its releases. */
class HeldKeys implements InputDevice {
  public releases = 0;

  public constructor(private readonly codes: readonly string[]) {}

  public attach(): void {
    this.releaseAll();
  }

  public detach(): void {
    this.releaseAll();
  }

  public writeInto(snapshot: MutableInputSnapshot): void {
    this.codes.forEach((code) => snapshot.keys.add(code));
  }

  public releaseAll(): void {
    this.releases += 1;
  }
}

const setUp = () => {
  const target = new EventTarget();
  const mapper = new InputMapper(PRESETS.wasd);
  const keyboard = new KeyboardDevice((code) => mapper.isBound(code));
  keyboard.attach(target);
  return { target, keyboard, mapper, input: new DeviceIntentSource([keyboard], mapper) };
};

describe('DeviceIntentSource', () => {
  it('reads the keys held now, through the bindings', () => {
    const { target, input } = setUp();

    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyD'));
    expect(input.read(IDENTITY).move).toEqual({ x: 1, y: 0 });

    target.dispatchEvent(fakeKeyEvent('keyup', 'KeyD'));
    expect(input.read(IDENTITY).move).toEqual({ x: 0, y: 0 });
  });

  it('merges every device into one intent', () => {
    const input = new DeviceIntentSource(
      [new HeldKeys(['KeyW']), new HeldKeys(['KeyD'])],
      new InputMapper(PRESETS.wasd),
    );

    const { move } = input.read(IDENTITY);

    expect(move.x).toBeCloseTo(Math.SQRT1_2);
    expect(move.y).toBeCloseTo(-Math.SQRT1_2);
  });

  it('releases every device when focus is lost', () => {
    const devices = [new HeldKeys([]), new HeldKeys([])];
    const input = new DeviceIntentSource(devices, new InputMapper(PRESETS.wasd));

    input.releaseAll();

    expect(devices.map((device) => device.releases)).toEqual([1, 1]);
  });
});

describe('Player scenario: walking with the keyboard', () => {
  const startMatch = () => {
    // No countdown: core's countdown holds all movement, and this test walks from the start.
    const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
    const { target, input } = setUp();
    const world = prepareMatchWorld(config, 1);
    const match = new Match({
      simulation: new Simulation({
        config: seatedConfig(config, world.map, PLAYER),
        seed: 1,
        logger: new NullLogger(),
      }),
      world,
      tickRate: config.tickRate,
      scheduler: new FakeFrameScheduler(),
      renderer: new RecordingRenderer(),
      camera: new Camera({ x: 0, y: 0 }, 64, 36),
      input,
      player: PLAYER,
      logger: new MemoryLogger(),
      onCrash: () => undefined,
      bridge: {
        bus: new TypedEventBus<BridgeEventMap>(),
        publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
        captureKinds: [],
      },
    });
    const position = () => {
      const player = match.snapshot.entities.find((entity) => entity.id === match.playerEntityId);
      return { x: player?.transform?.x ?? Number.NaN, y: player?.transform?.y ?? Number.NaN };
    };
    const ticks = (count: number) => {
      for (let tick = 0; tick < count; tick += 1) {
        match.tick();
      }
    };
    return { target, input, match, position, ticks };
  };

  it('a player who holds W for 2 seconds walks north, and stops after letting go', () => {
    const { target, position, ticks } = startMatch();
    ticks(1);
    const start = position();

    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW'));
    ticks(60);
    const walked = position();
    target.dispatchEvent(fakeKeyEvent('keyup', 'KeyW'));
    ticks(60);
    const settled = position();
    ticks(10);

    expect(walked.y).toBeLessThan(start.y);
    expect(walked.x).toBeCloseTo(start.x);
    expect(position()).toEqual(settled);
  });

  it('a player who alt-tabs while holding D stops walking', () => {
    const { target, input, position, ticks } = startMatch();
    ticks(1);
    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyD'));
    ticks(10);

    input.releaseAll();
    ticks(60);
    const settled = position();
    ticks(10);

    expect(position()).toEqual(settled);
  });
});
