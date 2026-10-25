import { createDefaultGameConfig, type Logger, makeLogRecord, SEVERITY } from '@eternalus/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { connectBusToStore } from './bridge/connectBusToStore';
import { eventBus } from './bridge/eventBus';
import { store } from './bridge/store';
import { ConsoleSink } from './data/logging/ConsoleSink';
import { SinkLogger } from './data/logging/SinkLogger';
import { MemoryStorageAdapter } from './data/persistence/MemoryStorageAdapter';
import { PersistenceController } from './data/persistence/PersistenceController';
import { ASSET_LICENCES } from './data/resources/assetLicences';
import { ASSET_MANIFEST } from './data/resources/AssetManifest';
import { describeCredits } from './data/resources/describeCredits';
import { FontLoader } from './data/resources/loaders/FontLoader';
import { UiImageLoader } from './data/resources/loaders/UiImageLoader';
import { ResourceController } from './data/resources/ResourceController';
import { createCoreCatalogue } from './game/content/coreCatalogue';
import { PLACEHOLDER_PLAYER_NAME } from './game/content/placeholderSetup';
import { createBrowserMatch } from './game/createBrowserMatch';
import { readDeveloperFlags } from './game/developerFlags';
import { PerformanceSessionClock } from './game/engine/time/PerformanceSessionClock';
import { GameCanvas } from './game/GameCanvas';
import { INPUT_ACTIONS } from './game/input/keybindings';
import type { MatchViewport } from './game/MatchViewport.types';
import { prepareMatchWorld } from './game/prepareMatchWorld';
import { SettingsController } from './game/settings/SettingsController';
import { SessionController } from './game/SessionController';
import { createDefaultSessionStates } from './game/session/defaultSessionStates';
import { LcgRng } from './game/session/LcgRng';
import { App } from './ui/App';
import { STRINGS } from './ui/strings';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Missing #root element in index.html');
}

// The composition root: the only place game/ and ui/ meet. Everything here lives as long as the
// page, except what the match factory builds, which lives as long as one match (13 §2, DEC-50).
const gameConfig = createDefaultGameConfig();
const sessionClock = new PerformanceSessionClock();
const consoleSink = new ConsoleSink();
const logger: Logger = new SinkLogger(
  () => sessionClock.now(),
  [{ sink: consoleSink, minSeverity: SEVERITY.WARN }],
);
// The developer flag of 13 §4 (query form, DV-118), read once: explorer chrome and display overrides.
const developer = readDeveloperFlags(window.location.search);

connectBusToStore(eventBus, store.dispatch);
const persistence = new PersistenceController({
  adapter: new MemoryStorageAdapter(),
  knownActions: new Set(INPUT_ACTIONS),
  now: () => Date.now(),
  warn: (body, attributes) => {
    logger.log(makeLogRecord('WARN', 'client.persistence', body, { attributes }));
  },
});
const settings = new SettingsController({ bus: eventBus, persistence, logger });
const resources = new ResourceController({
  manifest: ASSET_MANIFEST,
  loaders: [
    new UiImageLoader({ createImage: () => new Image() }),
    new FontLoader<FontFace>({
      createFace: (family, source, descriptors) => new FontFace(family, source, descriptors),
      fonts: document.fonts,
    }),
  ],
  pixelRatio: () => window.devicePixelRatio,
  warn: (body, attributes) => {
    logger.log(makeLogRecord('WARN', 'client.resources', body, { attributes }));
  },
});
const session = new SessionController({
  bus: eventBus,
  clock: sessionClock,
  states: createDefaultSessionStates(),
  catalogue: createCoreCatalogue({
    knownAssetIds: new Set(ASSET_MANIFEST.assets.map((entry) => entry.id)),
    overrides: developer.displayOverrides,
  }),
  matchConfig: gameConfig.match,
  playerName: PLACEHOLDER_PLAYER_NAME,
  seedSource: () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0,
  createRng: (seed) => new LcgRng(seed),
  themeRoot: document.documentElement,
  prepareWorld: (seed) => prepareMatchWorld(gameConfig, seed),
  createMatch: createBrowserMatch({
    window,
    document,
    gameConfig,
    bus: eventBus,
    settings,
    clock: sessionClock,
    sinks: [consoleSink],
  }),
  logger,
  resources,
  credits: describeCredits(ASSET_MANIFEST.assets, ASSET_LICENCES),
});
session.start();

// Settings load in the background: the store has no bindings until the settings event arrives.
void persistence
  .open()
  .catch((error: unknown) => {
    logger.log(
      makeLogRecord('ERROR', 'client.persistence', 'storage did not open', {
        attributes: { error: String(error) },
      }),
    );
  })
  .then(() => settings.start());

const attachViewport = (viewport: MatchViewport): (() => void) => session.attachViewport(viewport);
createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <App
        viewport={
          <GameCanvas
            attach={attachViewport}
            isExplorerShown={developer.isDeveloper}
            labels={STRINGS.viewport}
          />
        }
      />
    </Provider>
  </StrictMode>,
);
