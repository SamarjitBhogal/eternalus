import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AssetGroup, LoadingProgress } from '../events';

/** Progress of the asset group currently loading; `idle` before the first load. */
type LoadingSliceState = {
  readonly group: AssetGroup | null;
  readonly loaded: number;
  readonly total: number;
  readonly bytesLoaded: number;
  readonly bytesTotal: number;
  readonly status: 'idle' | LoadingProgress['status'];
};

const initialState: LoadingSliceState = {
  group: null,
  loaded: 0,
  total: 0,
  bytesLoaded: 0,
  bytesTotal: 0,
  status: 'idle',
};

/** Mirror of the latest `loading-progress` event. */
export const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    progressChanged: (_state, action: PayloadAction<LoadingProgress>) => action.payload,
  },
});
