import type { SessionPhase } from '../../bridge/events';
import type { SessionState } from '../SessionController.types';
import { BootState } from './states/BootState';
import { CharacterSelectState } from './states/CharacterSelectState';
import { LoadingState } from './states/LoadingState';
import { MatchLoadingState } from './states/MatchLoadingState';
import { MatchState } from './states/MatchState';
import { MenuState } from './states/MenuState';
import { PreLaunchState } from './states/PreLaunchState';
import { ResultsState } from './states/ResultsState';

/**
 * The one place that lists the concrete session states, one per `SessionPhase`.
 * @param options - `isSelectTimeoutEnabled`: whether character select times out to the menu
 *   (default on).
 */
export function createDefaultSessionStates(
  options: { readonly isSelectTimeoutEnabled?: boolean } = {},
): Readonly<Record<SessionPhase, SessionState>> {
  const { isSelectTimeoutEnabled = true } = options;
  return {
    boot: new BootState(),
    menu: new MenuState(),
    loading: new LoadingState(),
    'character-select': new CharacterSelectState(isSelectTimeoutEnabled),
    'pre-launch': new PreLaunchState(),
    'match-loading': new MatchLoadingState(),
    match: new MatchState(),
    results: new ResultsState(),
  };
}
