import { createDefaultGameConfig, MemoryLogger } from '@eternalus/core';
import { vi } from 'vitest';

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
import { coreCatalogue } from './content/coreCatalogue';
import { FakeSessionClock } from './engine/time/FakeSessionClock';
import { prepareMatchWorld } from './prepareMatchWorld';
import { SessionController } from './SessionController';
import type { SessionContext, SessionControllerDeps } from './SessionController.types';
import { createDefaultSessionStates } from './session/defaultSessionStates';
import { LcgRng } from './session/LcgRng';
import { SELECTION_ASSET_GROUPS } from './session/selectionAssetGroups';

/** Rounds of `await` that let a settled fake load reach the session's callbacks. */
const MICROTASK_ROUNDS = 20;

/**
 * Resources whose every group holds one small image (`test-<group>`), loaded by a
 * `FakeAssetLoader` that keeps each load pending until `loader.resolveAll()` (no timers).
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
 * bus, a `FakeSessionClock`, the default states, `coreCatalogue`, core's match config, seeds
 * counting from 42, `LcgRng`, a bare theme root, worlds from `prepareMatchWorld`, a match factory
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
    catalogue: coreCatalogue,
    matchConfig: config.match,
    playerName: 'Tester',
    seedSource: () => ++seed,
    createRng: (value) => new LcgRng(value),
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

/**
 * A `SessionContext` for a state's unit test: a real bus and `FakeSessionClock`, the shipped
 * catalogue and credits, and a spy for every method (`createMatch` returns spied handles,
 * `loadAssets` a spied cancel; `selection()` is `null` until a test changes it).
 */
export function spyContext() {
  return {
    bus: new TypedEventBus<BridgeEventMap>(),
    clock: new FakeSessionClock(),
    catalogue: coreCatalogue.load(),
    credits: describeCredits(ASSET_MANIFEST.assets, ASSET_LICENCES),
    transition: vi.fn<SessionContext['transition']>(),
    newMatchSetup: vi.fn<SessionContext['newMatchSetup']>(),
    repeatMatchSetup: vi.fn<SessionContext['repeatMatchSetup']>(),
    clearMatchSetup: vi.fn<SessionContext['clearMatchSetup']>(),
    selection: vi.fn<SessionContext['selection']>(() => null),
    recordSelection: vi.fn<SessionContext['recordSelection']>(),
    prepareWorld: vi.fn<SessionContext['prepareWorld']>(),
    createMatch: vi.fn<SessionContext['createMatch']>(() => ({
      destroy: vi.fn(),
      setPaused: vi.fn(),
    })),
    dropWorld: vi.fn<SessionContext['dropWorld']>(),
    abortMatch: vi.fn<SessionContext['abortMatch']>(),
    loadAssets: vi.fn<SessionContext['loadAssets']>(() => vi.fn()),
    releaseAssets: vi.fn<SessionContext['releaseAssets']>(),
  } satisfies SessionContext;
}
