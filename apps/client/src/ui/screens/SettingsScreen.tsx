import { type ReactElement, useId, useState } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';
import type { ScreenProps } from './screen.types';
import styles from './SettingsScreen.module.css';
import { SettingsScreenControls } from './SettingsScreenControls';
import { SettingsScreenOptions } from './SettingsScreenOptions';

/** The sections, in tab order. */
const TABS = ['controls', 'audio', 'video', 'accessibility'] as const;

type SettingsTab = (typeof TABS)[number];

/**
 * Settings: Controls (press-to-bind), Audio, Video and Accessibility tabs. The menu shows it as a
 * screen; the pause overlay embeds it (`isOverlay`), and Back then returns to the pause menu.
 */
export function SettingsScreen({
  isOverlay = false,
}: ScreenProps & { readonly isOverlay?: boolean }): ReactElement {
  const [tab, setTab] = useState<SettingsTab>('controls');
  const id = useId();
  const tabId = (each: SettingsTab): string => `${id}-${each}`;

  const panel = (
    <Panel title={STRINGS.settings.title}>
      <div role="tablist" aria-label={STRINGS.settings.tablist} className={styles.tabs}>
        {TABS.map((each) => (
          <button
            key={each}
            id={tabId(each)}
            type="button"
            role="tab"
            aria-selected={each === tab}
            aria-controls={`${id}-panel`}
            className={styles.tab}
            onClick={() => {
              setTab(each);
            }}
          >
            {STRINGS.settings.tabs[each]}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={tabId(tab)} className={styles.panel}>
        {tab === 'controls' ? <SettingsScreenControls /> : <SettingsScreenOptions tab={tab} />}
      </div>
      <Button
        onClick={() => {
          emitIntent(
            isOverlay
              ? { kind: 'open-overlay', overlay: 'pause' }
              : { kind: 'navigate', route: 'home' },
          );
        }}
      >
        {STRINGS.back}
      </Button>
    </Panel>
  );
  return isOverlay ? panel : <ScreenFrame>{panel}</ScreenFrame>;
}
