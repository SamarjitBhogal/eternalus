import type { Logger } from '@eternalus/core';

import type { BridgeEventMap } from '../../bridge/events';
import type { SettingsSliceState } from '../../bridge/slices/settingsSlice';
import type { TypedEventBus } from '../../bridge/TypedEventBus';
import type { SavedSettings } from './settingsState.types';

/** The part of `PersistenceController` the settings use (it satisfies this structurally). */
type SettingsStorage = {
  loadSettings(): Promise<SavedSettings | null>;
  saveSettings(settings: SettingsSliceState): Promise<void>;
};

/** What `main.tsx` injects into `SettingsController`. */
export type SettingsControllerDeps = {
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly persistence: SettingsStorage;
  /** Where load and save failures are reported. */
  readonly logger: Logger;
};
