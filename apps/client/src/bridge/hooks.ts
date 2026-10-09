import { useSelector } from 'react-redux';

import type { RootState } from './store';

/** `useSelector` typed with the root state. Components never dispatch: they emit `ui-intent`s. */
export const useAppSelector = useSelector.withTypes<RootState>();
