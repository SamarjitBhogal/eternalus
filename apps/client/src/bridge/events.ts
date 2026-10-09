/**
 * The ONLY list of game ↔ UI messages (architecture 13 §5) and the display types they carry.
 * `game/` emits game → UI events; `ui/` emits only `ui-intent`. `connectBusToStore` copies every
 * game → UI event into its slice.
 */
import type { InputAction, InputChord } from './Binding.types';
import type { LegendClassId, PlayableTeam, Team } from './domain.types';
import type { Announcement, HudSnapshot } from './slices/hudSlice';
import type { SettingsPatch, SettingsSliceState } from './slices/settingsSlice';

/** Every session phase, in flow order (architecture 13 §2). */
export const SESSION_PHASES = [
  'boot',
  'menu',
  'loading',
  'character-select',
  'pre-launch',
  'match-loading',
  'match',
  'results',
] as const;

/** Where the player is in the session; one `SessionState` per phase. */
export type SessionPhase = (typeof SESSION_PHASES)[number];

/** Sub-screens of the menu phase (a store value, not a session phase). */
export type MenuRoute = 'home' | 'loadouts' | 'profile' | 'settings' | 'about';

/** Overlays that can open over the match. */
export type Overlay = 'pause' | 'settings';

/** Everything the UI can ask the game to do. Components emit these and never write the store. */
export type UiIntent =
  | { readonly kind: 'start-match' }
  | { readonly kind: 'navigate'; readonly route: MenuRoute }
  | { readonly kind: 'select-class'; readonly classId: LegendClassId; readonly specId?: string }
  | { readonly kind: 'confirm-selection' }
  | { readonly kind: 'cancel-match' }
  | { readonly kind: 'leave-match' }
  | { readonly kind: 'open-overlay'; readonly overlay: Overlay }
  | { readonly kind: 'close-overlay' }
  | {
      readonly kind: 'update-binding';
      readonly action: InputAction;
      readonly chord: InputChord;
      /** What to do when the chord is already bound to another action. */
      readonly onConflict: 'swap' | 'replace';
    }
  /** `action: null` resets every binding. */
  | { readonly kind: 'reset-bindings'; readonly action: InputAction | null }
  | { readonly kind: 'update-settings'; readonly patch: SettingsPatch };

/** One Legend shown on the selection and loading screens, built before the simulation exists. */
export type RosterEntry = {
  readonly legendId: string;
  readonly displayName: string;
  readonly classId: LegendClassId;
  readonly specId: string | null;
  readonly isBot: boolean;
  readonly isPlayer: boolean;
  /** The team's Rover: the human on their team (DISC-51), the hard bot on the other. */
  readonly isRover: boolean;
  readonly team: PlayableTeam;
};

/** A Legend class as the selection screens show it. Specs are post-MVP slots. */
export type LegendClassCard = {
  readonly classId: LegendClassId;
  readonly displayName: string;
  readonly blurb: string;
  readonly specs: readonly {
    readonly specId: string;
    readonly displayName: string;
    readonly status: 'post-mvp';
  }[];
};

/** One layer of a themed background. Colours are token names (`--team-light-primary`), never literals. */
export type BackgroundLayer =
  | { readonly kind: 'gradient'; readonly angleDeg: number; readonly stops: readonly string[] }
  | { readonly kind: 'particles'; readonly count: number; readonly colourToken: string }
  | { readonly kind: 'image'; readonly src: string };

/** A swappable background (architecture contract §2.5): content, so real art drops in as data. */
export type BackgroundSet = {
  readonly id: string;
  readonly team: Team;
  readonly layers: readonly BackgroundLayer[];
};

/** Display-ready content projected into the store at boot. */
export type DisplayCatalogue = {
  readonly legendClasses: readonly LegendClassCard[];
  readonly backgroundSets: readonly BackgroundSet[];
  /** Themed display name of the profile screen ("Chronicle", naming.md). */
  readonly profileDisplayName: string;
};

/** Asset groups the session loads (architecture 14). */
export type AssetGroup = 'boot' | 'selection' | 'match';

/** Progress of one asset group load. */
export type LoadingProgress = {
  readonly group: AssetGroup;
  readonly loaded: number;
  readonly total: number;
  readonly bytesLoaded: number;
  readonly bytesTotal: number;
  readonly status: 'loading' | 'ready' | 'failed';
};

/** The match being set up: seed, the player's team and both rosters (allies include the player). */
export type MatchSetupDraft = {
  readonly seed: number;
  readonly playerTeam: PlayableTeam;
  readonly allies: readonly RosterEntry[];
  readonly enemies: readonly RosterEntry[];
};

/** The player's class pick on the character-select screen. */
export type ClassSelection = { readonly classId: LegendClassId; readonly specId: string | null };

/** Simulation time for the match clock. */
export type MatchClock = { readonly tick: number; readonly seconds: number };

/** Every message on the bridge bus, keyed by event name. */
export type BridgeEventMap = {
  'ui-intent': UiIntent;
  'session-phase': { readonly phase: SessionPhase; readonly reason: string | null };
  'menu-route': { readonly route: MenuRoute };
  overlay: { readonly overlay: Overlay | null };
  'content-catalogue': DisplayCatalogue;
  'loading-progress': LoadingProgress;
  /** `null` clears the setup (back to the menu). */
  'match-setup': MatchSetupDraft | null;
  'class-selection': ClassSelection;
  /** Remaining session time of the select (60 s) or reveal (10 s) countdown. */
  countdown: { readonly kind: 'select' | 'reveal'; readonly remainingMs: number };
  'match-clock': MatchClock;
  'hud-state': HudSnapshot;
  announcement: Announcement;
  /** The whole settings state, published whenever it changes. */
  settings: SettingsSliceState;
};
