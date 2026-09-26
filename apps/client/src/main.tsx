import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { store } from './bridge/store';
import { GameCanvas } from './game/GameCanvas';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Missing #root element in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <GameCanvas />
    </Provider>
  </StrictMode>,
);
