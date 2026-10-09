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
import { SettingsController } from './game/input/SettingsController';
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
  states: createDefaultSessionStates(),
  catalogue: placeholderCatalogue,
  matchConfig: PLACEHOLDER_MATCH_CONFIG,
  playerName: PLACEHOLDER_PLAYER_NAME,
  seedSource: () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0,
  createRng: (seed) => new LcgRng(seed),
  themeRoot: document.documentElement,
});
session.start();

// Settings load in the background; the slice holds defaults until they arrive.
const persistence = new PersistenceController({
  adapter: new MemoryStorageAdapter(),
  knownActions: new Set(INPUT_ACTIONS),
  now: () => Date.now(),
});
void persistence.open().then(() => new SettingsController({ bus: eventBus, persistence }).start());

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <App viewport={<GameCanvas />} />
    </Provider>
  </StrictMode>,
);
