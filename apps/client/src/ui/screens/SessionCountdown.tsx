import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import type { RootState } from '../../bridge/store';
import { Countdown } from '../components/Countdown';

type SessionCountdownProps = {
  /** The countdown's whole seconds left (a `matchSetupSlice` selector). */
  readonly seconds: (state: RootState) => number;
  readonly label: string;
};

/**
 * A session countdown (character select, the win/lose screen): the only reader of the 1 Hz
 * value, so the screen around it never re-renders on it.
 */
export function SessionCountdown({ seconds, label }: SessionCountdownProps): ReactElement {
  const remainingSeconds = useAppSelector(seconds);
  return <Countdown remainingSeconds={remainingSeconds} label={label} />;
}
