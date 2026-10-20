import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { useAppSelector } from '../../bridge/hooks';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import type { ScreenProps } from '../screens/screen.types';
import { STRINGS } from '../strings';
import { Button } from './Button';
import { Panel } from './Panel';
import styles from './PlaceholderScreen.module.css';

/**
 * Stands in for a screen another session is building: names the phase (or menu route), shows
 * the viewport if given, and offers the way out where one exists. Replaced one line at a time
 * in `App.tsx`.
 */
export function PlaceholderScreen({ viewport }: ScreenProps): ReactElement {
  const phase = useAppSelector(sessionSlice.selectors.selectSessionPhase);
  const route = useAppSelector(sessionSlice.selectors.selectMenuRoute);
  const title =
    phase === 'menu' ? STRINGS.placeholder.routes[route] : STRINGS.placeholder.phases[phase];
  const exit: { readonly label: string; readonly intent: UiIntent } | null =
    phase === 'menu'
      ? { label: STRINGS.back, intent: { kind: 'navigate', route: 'home' } }
      : phase === 'match'
        ? { label: STRINGS.placeholder.leaveMatch, intent: { kind: 'leave-match' } }
        : null;
  return (
    <main className={styles.screen}>
      {viewport}
      <div className={styles.overlay}>
        <Panel title={title}>
          <p>{STRINGS.placeholder.body}</p>
          {exit !== null && (
            <Button
              onClick={() => {
                emitIntent(exit.intent);
              }}
            >
              {exit.label}
            </Button>
          )}
        </Panel>
      </div>
    </main>
  );
}
