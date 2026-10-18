import { combineSlices, configureStore } from '@reduxjs/toolkit';

import { assetsSlice } from './slices/assetsSlice';
import { contentSlice } from './slices/contentSlice';
import { hudSlice } from './slices/hudSlice';
import { loadingSlice } from './slices/loadingSlice';
import { matchSetupSlice } from './slices/matchSetupSlice';
import { matchSlice } from './slices/matchSlice';
import { sessionSlice } from './slices/sessionSlice';
import { settingsSlice } from './slices/settingsSlice';

/**
 * Root reducer of the single parent store. Register every feature slice here.
 */
const rootReducer = combineSlices(
  sessionSlice,
  matchSetupSlice,
  loadingSlice,
  settingsSlice,
  hudSlice,
  matchSlice,
  contentSlice,
  assetsSlice,
);

/** The whole store state, one key per slice. */
export type RootState = ReturnType<typeof rootReducer>;

/**
 * Builds a store. The app uses the `store` singleton below; tests build their own from fixtures.
 */
export function createAppStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

/** The application's one Redux store (one of the two allowed singletons, with the event bus). */
export const store = createAppStore();

/** The store's `dispatch`, typed with every slice action. */
export type AppDispatch = typeof store.dispatch;
