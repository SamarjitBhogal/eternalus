/**
 * The ONLY list of game ↔ UI messages (architecture 13 §5). The display types they carry live in
 * `catalogue.types.ts` and `hud.types.ts`. `game/` emits game → UI events; `ui/` emits only
 * `ui-intent`. `connectBusToStore` copies every game → UI event into its slice.
 */
import type { InputAction, InputChord } from './Binding.types';
import type { AssetId, DisplayCatalogue, RasterBox } from './catalogue.types';
import type { CrashReportState } from './CrashReport.types';
import type { DevCommand, DeveloperMenuState } from './developerMenu.types';
import type { LegendClassId, MatchEndReason, PlayableTeam } from './domain.types';
import type {
  Announcement,
  CapturePointStatus,
  PlayerHudSnapshot,
  StructureStatus,
} from './hud.types';
import type { SettingsPatch, SettingsSliceState } from './slices/settingsSlice';

/** How a match ended, for the results screen. */
export type MatchResultSummary = {
  /** The winning team; `null` for a draw. */
  readonly winner: PlayableTeam | null;
  /** The viewing player's own team. */
  readonly ownTeam: PlayableTeam;
  /** Why the server ended the match. */
  readonly reason: MatchEndReason;
};

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
export type MenuRoute =
  | 'home'
  | 'loadouts'
  | 'profile'
  | 'settings'
  | 'about'
  /** The online Duel's waiting screen: searching for an opponent (ADR 0016). */
  | 'duel-queue';

/** Overlays that can open over the match. */
export type Overlay = 'pause' | 'settings';

/** Everything the UI can ask the game to do. Components emit these and never write the store. */
export type UiIntent =
  | { readonly kind: 'start-match' }
  /** Join the online Duel queue (ADR 0016); the menu shows the waiting screen. */
  | { readonly kind: 'start-duel' }
  /** Leave the Duel queue and return to the home screen. */
  | { readonly kind: 'cancel-duel' }
  | { readonly kind: 'navigate'; readonly route: MenuRoute }
  | { readonly kind: 'select-class'; readonly classId: LegendClassId; readonly specId?: string }
  | { readonly kind: 'confirm-selection' }
  /**
   * Back from the Legend step: clears the class (and Legend) pick; the countdown runs on (HC-F1).
   */
  | { readonly kind: 'clear-class-selection' }
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
  | { readonly kind: 'update-settings'; readonly patch: SettingsPatch }
  /** A screen threw while rendering (`ErrorBoundary`, ADR 0025 §5); all plain strings. */
  | {
      readonly kind: 'report-screen-crash';
      readonly screen: string;
      readonly message: string;
      readonly stack: string;
      readonly componentStack: string;
    }
  /** The player's note on a crash (the crash popup, DEC-106). */
  | { readonly kind: 'save-crash-note'; readonly note: string }
  | { readonly kind: 'dismiss-crash-report' }
  /** The developer menu's gameplay button: `Match` enqueues the command; ignored while the menu is off (13 §4). */
  | { readonly kind: 'dev-command'; readonly command: DevCommand };

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

/**
 * Why a phase was entered (audit AS-13: a union, so a typo cannot silently drop a banner);
 * `match-crashed`: the running match stopped on a throw (DEC-106); `screen-crashed`: a screen
 * outside a match did (DEC-124 (b)). Both open the crash popup.
 */
export type SessionReason =
  | 'select-timeout'
  | 'cancelled'
  | 'match-failed'
  | 'match-crashed'
  | 'screen-crashed'
  | 'load-failed'
  /** The connection to the Duel server ended before the Duel did. */
  | 'duel-unavailable';

/**
 * When assets load (13 §2): `selection` holds what both class layouts and the Legend step show, the
 * layout groups the rest (14 §14); the `-raster` groups hold only plates, loaded only on the
 * `'figma-raster'` effects renderer (DEC-54). Restated in `data/resources/AssetManifest.types.ts`.
 */
export type AssetGroup =
  | 'boot'
  | 'selection'
  | 'selection-primary'
  | 'selection-alternate'
  | 'selection-raster'
  | 'selection-primary-raster'
  | 'match';

/**
 * URLs of a group's loaded images and the draw boxes its entries declare (both `{}` after
 * release); `ui/` reads them by asset id.
 */
export type AssetUrls = {
  readonly group: AssetGroup;
  /** By asset id, or `id@rendition` for a rendition's own file (a string, as `AssetId` is). */
  readonly urls: Readonly<Record<AssetId, string>>;
  /** Keyed like `urls`; only a file the screens place at the slot it was baked for has one. */
  readonly boxes: Readonly<Record<AssetId, RasterBox>>;
};

/** One licence block of the About screen, generated from the asset manifest (13 §3 `selectCredits`). */
export type CreditEntry = {
  readonly licenceId: string;
  readonly work: string;
  readonly licenceName: string;
  readonly notice: string;
  /** Licence text that must ship with the files (OFL, MIT); `null` for the owner's own art. */
  readonly licenceText: string | null;
  readonly assets: readonly { readonly assetId: AssetId; readonly source: string }[];
};

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

/** Both rosters once LOCK IN has filled them: every bot with its Legend, the enemy Rover mirrored. */
export type FilledRosters = Pick<MatchSetupDraft, 'allies' | 'enemies'>;

/** Simulation time for the match clock. */
export type MatchClock = { readonly tick: number; readonly seconds: number };

/** Every message on the bridge bus, keyed by event name. */
export type BridgeEventMap = {
  'ui-intent': UiIntent;
  'session-phase': { readonly phase: SessionPhase; readonly reason: SessionReason | null };
  'menu-route': { readonly route: MenuRoute };
  overlay: { readonly overlay: Overlay | null };
  /** The crash popup's state; `null` closes it. */
  'crash-report': CrashReportState | null;
  'content-catalogue': DisplayCatalogue;
  'loading-progress': LoadingProgress;
  /** `null` clears the setup (back to the menu). */
  'match-setup': MatchSetupDraft | null;
  /** `null` clears the pick (back to the class step). */
  'class-selection': ClassSelection | null;
  /**
   * LOCK IN: the pick is locked until the countdown ends (DEC-60), and the rosters carry every
   * bot's Legend and the enemy Rover's mirror of the pick (DEC-61).
   */
  'selection-locked': FilledRosters;
  /** Remaining session time of the select (60 s) or reveal (10 s) countdown. */
  countdown: { readonly kind: 'select' | 'reveal'; readonly remainingMs: number };
  'match-clock': MatchClock;
  /** How a match ended, for the results screen. */
  'match-result': MatchResultSummary;
  /** The human Legend for the HUD, every 6 ticks (13 §5); `null` before it spawns. */
  'hud-state': { readonly player: PlayerHudSnapshot | null };
  /** Team structures, at match start and every 30 ticks (13 §9 recipe). */
  'structure-state': { readonly structures: readonly StructureStatus[] };
  /** Capture points in lane order, at match start and every 30 ticks (13 §5). */
  'capture-state': { readonly points: readonly CapturePointStatus[] };
  /** A group's loaded image URLs; `{}` after its release. */
  'asset-urls': AssetUrls;
  /** The licence blocks of every bundled asset, once at boot. */
  credits: { readonly entries: readonly CreditEntry[] };
  announcement: Announcement;
  /** The player's minimap key showed (`true`) or hid (`false`) the minimap (DEC-147). */
  'minimap-visibility': { readonly isShown: boolean };
  /** The developer menu's state: enabled, open, and its pickers (13 §4). */
  'developer-menu': DeveloperMenuState;
  /** The whole settings state, published whenever it changes. */
  settings: SettingsSliceState;
};
