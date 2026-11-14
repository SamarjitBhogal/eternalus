import { emitIntent } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import type { MenuItem } from '../components/MenuList';
import { STRINGS } from '../strings';

/**
 * The home screen's options, top to bottom (reference 14 §1). "Start match" starts a match against
 * bots directly; "Duel online" joins the Duel queue (ADR 0016). The profile option uses the content display name.
 */
export function mainMenuItems(profileDisplayName: string): readonly MenuItem[] {
  const options: readonly (readonly [id: string, label: string, intent: UiIntent])[] = [
    ['start-match', STRINGS.menu.startMatch, { kind: 'start-match' }],
    ['duel-online', STRINGS.menu.duelOnline, { kind: 'start-duel' }],
    ['loadouts', STRINGS.menu.loadouts, { kind: 'navigate', route: 'loadouts' }],
    ['profile', profileDisplayName, { kind: 'navigate', route: 'profile' }],
    ['settings', STRINGS.menu.settings, { kind: 'navigate', route: 'settings' }],
    ['about', STRINGS.menu.about, { kind: 'navigate', route: 'about' }],
  ];
  return options.map(([id, label, intent]) => ({
    id,
    label,
    onSelect: () => {
      emitIntent(intent);
    },
  }));
}
