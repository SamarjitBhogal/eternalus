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
 * @param options - `preselectedClassId`: a class character select starts with (default none).
 */
export function createDefaultSessionStates(
  options: { readonly preselectedClassId?: string } = {},
): Readonly<Record<SessionPhase, SessionState>> {
  const { preselectedClassId = null } = options;
  return {
    boot: new BootState(),
    menu: new MenuState(),
    loading: new LoadingState(),
    'character-select': new CharacterSelectState(preselectedClassId),
    'pre-launch': new PreLaunchState(),
    'match-loading': new MatchLoadingState(),
    match: new MatchState(),
    results: new ResultsState(),
  };
}
