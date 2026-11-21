import type { ReactElement, ReactNode } from 'react';

import type { Team } from '../../bridge/domain.types';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import styles from './ScreenFrame.module.css';
import { ThemedBackground } from './ThemedBackground';

/**
 * How the content sits over the background: `panel` = a padded column (the menus); `stage` = a
 * full-bleed, clipped host for the selection screens' scaled artboard (`SelectionStage`).
 */
type ScreenFrameLayout = 'panel' | 'stage';

const LAYOUT_CLASSES: Readonly<Record<ScreenFrameLayout, string | undefined>> = {
  panel: styles.content,
  stage: styles.stage,
};

/** A full-screen `<main>` over the content background set of `team`. */
export function ScreenFrame({
  team = 'neutral',
  layout = 'panel',
  children,
}: {
  readonly team?: Team;
  readonly layout?: ScreenFrameLayout;
  readonly children: ReactNode;
}): ReactElement {
  const background = useAppSelector((state) =>
    contentSlice.selectors.selectBackgroundSet(state, team),
  );
  return (
    <main className={styles.screen}>
      <ThemedBackground set={background} />
      <div className={LAYOUT_CLASSES[layout]}>{children}</div>
    </main>
  );
}
