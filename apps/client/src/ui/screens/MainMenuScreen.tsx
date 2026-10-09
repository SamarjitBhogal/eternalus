import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import { MenuList } from '../components/MenuList';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';
import styles from './MainMenuScreen.module.css';
import { mainMenuItems } from './mainMenuItems';

/** The home screen: options stacked on the left over the themed background (reference 14 §1). */
export function MainMenuScreen(): ReactElement {
  const profileDisplayName = useAppSelector(contentSlice.selectors.selectProfileDisplayName);
  const reason = useAppSelector(sessionSlice.selectors.selectSessionReason);
  const banner = reason === null ? undefined : STRINGS.reasonBanners[reason];
  return (
    <ScreenFrame>
      <div className={styles.column}>
        <h1 className={styles.title}>{STRINGS.gameTitle}</h1>
        {banner !== undefined && (
          <p role="status" className={styles.banner}>
            {banner}
          </p>
        )}
        <MenuList label={STRINGS.menu.navLabel} items={mainMenuItems(profileDisplayName)} />
      </div>
    </ScreenFrame>
  );
}
