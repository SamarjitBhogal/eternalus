import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import { STRINGS } from '../strings';
import { Button } from './Button';
import { Panel } from './Panel';
import styles from './PlaceholderScreen.module.css';

/**
 * Stands in for a screen another session is building: names the phase (or menu route) and, on a
 * menu route, offers the way back home. It never hosts the game: only `MatchScreen` renders the
 * viewport (13 §3), so it takes no props. Replaced one line at a time in `App.tsx`.
 */
export function PlaceholderScreen(): ReactElement {
  const phase = useAppSelector(sessionSlice.selectors.selectSessionPhase);
  const route = useAppSelector(sessionSlice.selectors.selectMenuRoute);
  const title =
    phase === 'menu' ? STRINGS.placeholder.routes[route] : STRINGS.placeholder.phases[phase];
  return (
    <main className={styles.screen}>
      <div className={styles.overlay}>
        <Panel title={title}>
          <p>{STRINGS.placeholder.body}</p>
          {phase === 'menu' && (
            <Button
              onClick={() => {
                emitIntent({ kind: 'navigate', route: 'home' });
              }}
            >
              {STRINGS.back}
            </Button>
          )}
        </Panel>
      </div>
    </main>
  );
}
