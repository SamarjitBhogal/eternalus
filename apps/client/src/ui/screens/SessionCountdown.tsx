import type { ReactElement } from 'react';

import type { CountdownKind } from '../../bridge/events';
import { useAppSelector } from '../../bridge/hooks';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { Countdown } from '../components/Countdown';

type SessionCountdownProps = {
  /** Which session countdown it shows. */
  readonly kind: CountdownKind;
  readonly label: string;
  /** Whether UE-01's countdown urgency applies (the character select's, DEC-282). */
  readonly hasUrgency?: boolean;
};

/**
 * A session countdown (character select, the win/lose screen): the only reader of the 1 Hz
 * value, so the screen around it never re-renders on it.
 */
export function SessionCountdown({
  kind,
  label,
  hasUrgency = false,
}: SessionCountdownProps): ReactElement {
  const remainingSeconds = useAppSelector((state) =>
    matchSetupSlice.selectors.selectCountdownSeconds(state, kind),
  );
  return <Countdown remainingSeconds={remainingSeconds} label={label} hasUrgency={hasUrgency} />;
}
