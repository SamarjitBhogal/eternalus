import { createDefaultGameConfig, MemoryLogger, SeededRandom } from '@eternalus/core';

import { connectBusToStore } from '../bridge/connectBusToStore';
import type { AssetGroup, BridgeEventMap, SessionPhase, UiIntent } from '../bridge/events';
import { createAppStore } from '../bridge/store';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { ASSET_LICENCES } from '../data/resources/assetLicences';
import { ASSET_MANIFEST } from '../data/resources/AssetManifest';
import type { AssetManifest } from '../data/resources/AssetManifest.types';
import { describeCredits } from '../data/resources/describeCredits';
import { FakeAssetLoader } from '../data/resources/loaders/FakeAssetLoader';
import { ResourceController } from '../data/resources/ResourceController';
import { shippedCatalogue } from './content/__fixtures__/shippedCatalogue';
import { FakeSessionClock } from './engine/time/FakeSessionClock';
import { prepareMatchWorld } from './prepareMatchWorld';
import { SessionController } from './SessionController';
import { ROSTER_RNG_STREAM } from './SessionController.constants';
import type { SessionControllerDeps } from './SessionController.types';
import { createDefaultSessionStates } from './session/defaultSessionStates';
import { LcgRng } from './session/LcgRng';
import { SELECTION_ASSET_GROUPS } from './session/selectionAssetGroups';

/** Rounds of `await` that let a settled fake load reach the session's callbacks. */
const MICROTASK_ROUNDS = 20;

/** The draw box of `test-selection`, the one placed image of `testResources()`. */
export const TEST_SELECTION_BOX = { left: 10, top: 20, width: 30, height: 40 } as const;

/**
 * Resources whose every group holds one small image (`test-<group>`; `test-selection` with the
 * draw box `TEST_SELECTION_BOX`), loaded by a `FakeAssetLoader` that keeps each load pending
 * until `loader.resolveAll()` (no timers).
 */
export function testResources(): {
  readonly resources: ResourceController;
  readonly loader: FakeAssetLoader;
} {
  const groups: readonly AssetGroup[] = ['boot', ...SELECTION_ASSET_GROUPS, 'match'];
  const manifest: AssetManifest = {
    version: 'test',
    assets: groups.map((group) => ({
      id: `test-${group}`,
      type: 'ui-image',
      group,
      file: { url: `/test/${group}.webp`, bytes: 10, hash: '0'.repeat(64) },
      licence: 'owner',
      source: 'test fixture',
      ...(group === 'selection' ? { box: TEST_SELECTION_BOX } : {}),
    })),
  };
  const loader = new FakeAssetLoader();
  const resources = new ResourceController({
    manifest,
    loaders: [loader],
    pixelRatio: () => 1,
    warn: () => undefined,
  });
  return { resources, loader };
}

/**
 * A full `SessionControllerDeps` for tests (02 §8: real classes, fakes at the ports): a real
 * bus, a `FakeSessionClock`, the default states, `shippedCatalogue()`, core's match config, seeds
 * counting from 42, `LcgRng`, the real roster stream, a bare theme root, worlds from `prepareMatchWorld`, a match factory
 * returning an inert handle, a `MemoryLogger`, resources over an empty manifest (every load is
 * synchronous; pass `testResources()` for pending loads) and the shipped credits.
 */
export function testSessionDeps(
  overrides: Partial<SessionControllerDeps> = {},
): SessionControllerDeps {
  const config = createDefaultGameConfig();
  let seed = 41;
  return {
    bus: new TypedEventBus(),
    clock: new FakeSessionClock(),
    states: createDefaultSessionStates(),
    catalogue: shippedCatalogue(),
    matchConfig: config.match,
    playerName: 'Tester',
    seedSource: () => ++seed,
    createRng: (value) => new LcgRng(value),
    createRosterRng: (value) => new SeededRandom(value).fork(ROSTER_RNG_STREAM),
    themeRoot: { dataset: {} },
    prepareWorld: (value) => prepareMatchWorld(config, value),
    createMatch: () => ({ destroy: () => undefined, setPaused: () => undefined }),
    logger: new MemoryLogger(),
    resources: new ResourceController({
      manifest: { version: 'test', assets: [] },
      loaders: [],
      pixelRatio: () => 1,
      warn: () => undefined,
    }),
    credits: describeCredits(ASSET_MANIFEST.assets, ASSET_LICENCES),
    ...overrides,
  };
}

/** Lets every pending promise reaction run, without timers (after `loader.resolveAll()`). */
export async function flushMicrotasks(): Promise<void> {
  for (let round = 0; round < MICROTASK_ROUNDS; round += 1) {
    await Promise.resolve();
  }
}

/**
 * A `SessionController` over `testSessionDeps` and `testResources()` (loads pending until
 * `resolveLoads()`), wired to a real store, recording every phase it enters. `overrides` replace
 * any dependency.
 */
export function testSession(overrides: Partial<SessionControllerDeps> = {}) {
  const bus = overrides.bus ?? new TypedEventBus<BridgeEventMap>();
  const clock = new FakeSessionClock();
  const logger = new MemoryLogger();
  const themeRoot: Pick<HTMLElement, 'dataset'> = { dataset: {} };
  const { resources, loader } = testResources();
  const store = createAppStore();
  const disconnect = connectBusToStore(bus, store.dispatch);
  const phases: SessionPhase[] = [];
  const stopRecording = bus.on('session-phase', ({ phase }) => phases.push(phase));
  const deps = testSessionDeps({ bus, clock, logger, themeRoot, resources, ...overrides });
  const controller = new SessionController(deps);
  const intent = (value: UiIntent): void => {
    bus.emit('ui-intent', value);
  };
  /** Settles every asset load, group after group, letting the session react to each. */
  const resolveLoads = async (): Promise<void> => {
    do {
      loader.resolveAll();
      await flushMicrotasks();
    } while (loader.pendingCount > 0);
  };
  return {
    deps,
    controller,
    bus,
    clock,
    logger,
    themeRoot,
    store,
    resources,
    loader,
    phases,
    disconnect,
    stopRecording,
    intent,
    resolveLoads,
  };
}
