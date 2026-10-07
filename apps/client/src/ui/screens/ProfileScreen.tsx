import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';
import styles from './MenuPage.module.css';

/** Profile shell, titled with its content display name ("Chronicle"); history lands in sprint 2. */
export function ProfileScreen(): ReactElement {
  const title = useAppSelector(contentSlice.selectors.selectProfileDisplayName);
  return (
    <ScreenFrame>
      <Panel title={title}>
        <p className={styles.muted}>{STRINGS.comingSoon}</p>
        <p>{STRINGS.profile.history}</p>
        <Button
          autoFocus
          onClick={() => {
            emitIntent({ kind: 'navigate', route: 'home' });
          }}
        >
          {STRINGS.back}
        </Button>
      </Panel>
    </ScreenFrame>
  );
}
