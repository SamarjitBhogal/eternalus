import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { connectBusToStore } from './bridge/connectBusToStore';
import { eventBus } from './bridge/eventBus';
import { store } from './bridge/store';
import { placeholderCatalogue } from './game/content/placeholderCatalogue';
import {
  PLACEHOLDER_MATCH_CONFIG,
  PLACEHOLDER_PLAYER_NAME,
  PLACEHOLDER_PRESELECTED_CLASS_ID,
} from './game/content/placeholderSetup';
import { PerformanceSessionClock } from './game/engine/time/PerformanceSessionClock';
import { GameCanvas } from './game/GameCanvas';
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
  states: createDefaultSessionStates({ preselectedClassId: PLACEHOLDER_PRESELECTED_CLASS_ID }),
  catalogue: placeholderCatalogue,
  matchConfig: PLACEHOLDER_MATCH_CONFIG,
  playerName: PLACEHOLDER_PLAYER_NAME,
  seedSource: () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0,
  createRng: (seed) => new LcgRng(seed),
  themeRoot: document.documentElement,
});
session.start();

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <App viewport={<GameCanvas />} />
    </Provider>
  </StrictMode>,
);
