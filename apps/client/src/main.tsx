import { type Logger, makeLogRecord, NullLogger } from '@eternalus/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { connectBusToStore } from './bridge/connectBusToStore';
import { eventBus } from './bridge/eventBus';
import { store } from './bridge/store';
import { MemoryStorageAdapter } from './data/persistence/MemoryStorageAdapter';
import { PersistenceController } from './data/persistence/PersistenceController';
import { placeholderCatalogue } from './game/content/placeholderCatalogue';
import { PLACEHOLDER_MATCH_CONFIG, PLACEHOLDER_PLAYER_NAME } from './game/content/placeholderSetup';
import { PerformanceSessionClock } from './game/engine/time/PerformanceSessionClock';
import { GameCanvas } from './game/GameCanvas';
import { INPUT_ACTIONS } from './game/input/keybindings';
import { SettingsController } from './game/settings/SettingsController';
import { SessionController } from './game/SessionController';
import { createDefaultSessionStates } from './game/session/defaultSessionStates';
import { LcgRng } from './game/session/LcgRng';
import { App } from './ui/App';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Missing #root element in index.html');
}

// The composition root: the only place game/ and ui/ meet. Both live as long as the page.
connectBusToStore(eventBus, store.dispatch);
const session = new SessionController({
  bus: eventBus,
  clock: new PerformanceSessionClock(),
  // TODO(sam): turn the select timeout back on once the character select screen can pick a class;
  // until then it cancels every demo match after 60 s.
  states: createDefaultSessionStates({ isSelectTimeoutEnabled: false }),
  catalogue: placeholderCatalogue,
  matchConfig: PLACEHOLDER_MATCH_CONFIG,
  playerName: PLACEHOLDER_PLAYER_NAME,
  seedSource: () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0,
  createRng: (seed) => new LcgRng(seed),
  themeRoot: document.documentElement,
});
session.start();

// Settings load in the background: the store has no bindings until the settings event arrives.
// TODO(sam): replace NullLogger with the client's log sinks when they land (session H).
const logger: Logger = new NullLogger();
const persistence = new PersistenceController({
  adapter: new MemoryStorageAdapter(),
  knownActions: new Set(INPUT_ACTIONS),
  now: () => Date.now(),
  warn: (body, attributes) => {
    logger.log(makeLogRecord('WARN', 'client.persistence', body, { attributes }));
  },
});
const settings = new SettingsController({ bus: eventBus, persistence, logger });
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

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <App viewport={<GameCanvas />} />
    </Provider>
  </StrictMode>,
);
