import type { ComponentType, ReactElement, ReactNode } from 'react';

import type { MenuRoute, SessionPhase } from '../bridge/events';
import { useAppSelector } from '../bridge/hooks';
import { sessionSlice } from '../bridge/slices/sessionSlice';
import { PlaceholderScreen } from './components/PlaceholderScreen';
import { AboutScreen } from './screens/AboutScreen';
import { CharacterSelectScreen } from './screens/CharacterSelectScreen';
import { LoadoutScreen } from './screens/LoadoutScreen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { MatchScreen } from './screens/MatchScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import type { ScreenProps } from './screens/screen.types';
import { SelectTimeoutNotice } from './screens/SelectTimeoutNotice';
import { SettingsScreen } from './screens/SettingsScreen';

/** Session phase → screen: the one place a screen is registered (architecture 02 §9). */
const PHASE_SCREENS: Readonly<Record<Exclude<SessionPhase, 'menu'>, ComponentType<ScreenProps>>> = {
  boot: PlaceholderScreen,
  loading: PlaceholderScreen,
  'character-select': CharacterSelectScreen,
  'pre-launch': PlaceholderScreen,
  'match-loading': PlaceholderScreen,
  match: MatchScreen,
  results: ResultsScreen,
};

/** Menu route → screen, for the `menu` phase. */
const MENU_SCREENS: Readonly<Record<MenuRoute, ComponentType<ScreenProps>>> = {
  home: MainMenuScreen,
  loadouts: LoadoutScreen,
  profile: ProfileScreen,
  settings: SettingsScreen,
  about: AboutScreen,
};

/**
 * Shows the screen for the current session phase and menu route. Through the `menu` phase it also
 * mounts the select-timeout popup (DEC-102), above every menu route so a dismissal holds across
 * them.
 */
export function App({ viewport }: { readonly viewport?: ReactNode }): ReactElement {
  const phase = useAppSelector(sessionSlice.selectors.selectSessionPhase);
  const route = useAppSelector(sessionSlice.selectors.selectMenuRoute);
  if (phase !== 'menu') {
    const Screen = PHASE_SCREENS[phase];
    return <Screen viewport={viewport} />;
  }
  const Screen = MENU_SCREENS[route];
  return (
    <>
      <Screen viewport={viewport} />
      <SelectTimeoutNotice />
    </>
  );
}
