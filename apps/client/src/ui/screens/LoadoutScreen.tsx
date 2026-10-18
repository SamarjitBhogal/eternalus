import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { selectSelectableClasses } from '../../bridge/selectors/selectSelectableClasses';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';
import styles from './LoadoutScreen.module.css';

/** Loadouts shell: the playable classes (locked ones left out), read-only, until loadout editing lands. */
export function LoadoutScreen(): ReactElement {
  const legendClasses = useAppSelector(selectSelectableClasses);
  return (
    <ScreenFrame>
      <Panel title={STRINGS.loadouts.title}>
        <p className={styles.note}>{STRINGS.comingSoon}</p>
        <h3>{STRINGS.loadouts.classesTitle}</h3>
        <ul>
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
