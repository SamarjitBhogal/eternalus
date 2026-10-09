import type { SessionMatchConfig } from '../SessionController.types';

// TODO(sam): replace with createDefaultGameConfig().match when session B lands.
/** Match parameters the session needs before core's `GameConfig` exists (contract §2.2: 10 per team). */
export const PLACEHOLDER_MATCH_CONFIG: SessionMatchConfig = { legendsPerTeam: 10 };

// TODO(sam): read the profile's display name through PersistenceController (sprint 2).
/** The human player's roster name until profiles are persisted. */
export const PLACEHOLDER_PLAYER_NAME = 'Player';
