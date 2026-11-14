import { useSelector, useStore } from 'react-redux';

import type { createAppStore, RootState } from './store';

/** `useSelector` typed with the root state. Components never dispatch: they emit `ui-intent`s. */
export const useAppSelector = useSelector.withTypes<RootState>();

/** The store itself, for a handler that must read the state at event time (`getState()`), not at render. */
export const useAppStore = useStore.withTypes<ReturnType<typeof createAppStore>>();

/** Equality for `useAppSelector` over a selector that returns a fresh object (`ui/` never imports react-redux). */
export { shallowEqual } from 'react-redux';
