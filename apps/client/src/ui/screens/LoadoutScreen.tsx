import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';
import styles from './MenuPage.module.css';

/** Loadouts shell: the classes, read-only, until loadout editing lands in sprint 2. */
export function LoadoutScreen(): ReactElement {
  const legendClasses = useAppSelector(contentSlice.selectors.selectLegendClasses);
  return (
    <ScreenFrame>
      <Panel title={STRINGS.loadouts.title}>
        <p className={styles.muted}>{STRINGS.comingSoon}</p>
        <h3>{STRINGS.loadouts.classesTitle}</h3>
        <ul className={styles.list}>
          {legendClasses.map((card) => (
            <li key={card.classId}>
              <strong>{card.displayName}</strong>: {card.blurb}
            </li>
          ))}
        </ul>
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
