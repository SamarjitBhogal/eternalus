import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { Countdown } from '../components/Countdown';
import { STRINGS } from '../strings';

/**
 * The character-select session's countdown: the only reader of the 1 Hz value, so the steps
 * never re-render on it.
 */
export function SessionCountdown(): ReactElement {
  const seconds = useAppSelector(matchSetupSlice.selectors.selectCountdownSeconds);
  return <Countdown remainingSeconds={seconds} label={STRINGS.characterSelect.countdownLabel} />;
}
