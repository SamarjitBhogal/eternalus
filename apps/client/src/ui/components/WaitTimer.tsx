import { type ReactElement, useEffect, useState } from 'react';

import { ElapsedTimeFormatter } from './ElapsedTimeFormatter';
import { WAIT_TIMER_TICK_MS } from './WaitTimer.constants';

const formatter = new ElapsedTimeFormatter();

/** A live `mm:ss` count of how long the component has been mounted. A `timer`: never announced per tick. */
export function WaitTimer({ label }: { readonly label: string }): ReactElement {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsedSeconds((Date.now() - startedAt) / WAIT_TIMER_TICK_MS);
    }, WAIT_TIMER_TICK_MS);
    return () => {
      clearInterval(id);
    };
  }, []);
  return (
    <p role="timer" aria-label={label}>
      {formatter.format(elapsedSeconds)}
    </p>
  );
}
