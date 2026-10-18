/**
 * The ONLY list of game ↔ UI messages (architecture 13 §5). The display types they carry live in
 * `catalogue.types.ts` and `hud.types.ts`. `game/` emits game → UI events; `ui/` emits only
 * `ui-intent`. `connectBusToStore` copies every game → UI event into its slice.
 */
import type { InputAction, InputChord } from './Binding.types';
import type { AssetId, DisplayCatalogue } from './catalogue.types';
import type { LegendClassId, PlayableTeam } from './domain.types';
import type {
  Announcement,
  CapturePointStatus,
  PlayerHudSnapshot,
  StructureStatus,
} from './hud.types';
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
  /** Back from the Legend step: clears the class (and Legend) pick; the countdown runs on (F1). */
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

/** Why a phase was entered (audit AS-13: a union, so a typo cannot silently drop a banner). */
export type SessionReason = 'select-timeout' | 'cancelled' | 'match-failed' | 'load-failed';

/**
 * When assets load (13 §2): `selection` holds what both class layouts and the Legend step show, the
 * layout groups the rest (I-47); the `-raster` groups hold only plates, loaded only on the
 * `'figma-raster'` effects renderer (I-80, I-86). Restated in `data/resources/AssetManifest.types.ts`.
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
 * URL key of an asset (`id`) or of one of its renditions (`` `${AssetId}@${RenditionKey}` ``, e.g.
 * `oracle-portrait@ally-tile`). Both forms are strings while `AssetId` is `string`, so the type is
 * `AssetId` itself.
 */
export type AssetUrlKey = AssetId;

/** URLs of a group's loaded images (`{}` after release); `ui/` reads them by asset id. */
export type AssetUrls = {
  readonly group: AssetGroup;
  readonly urls: Readonly<Record<AssetUrlKey, string>>;
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

/** Simulation time for the match clock. */
export type MatchClock = { readonly tick: number; readonly seconds: number };

/** Every message on the bridge bus, keyed by event name. */
export type BridgeEventMap = {
  'ui-intent': UiIntent;
  'session-phase': { readonly phase: SessionPhase; readonly reason: SessionReason | null };
  'menu-route': { readonly route: MenuRoute };
  overlay: { readonly overlay: Overlay | null };
  'content-catalogue': DisplayCatalogue;
  'loading-progress': LoadingProgress;
  /** `null` clears the setup (back to the menu). */
  'match-setup': MatchSetupDraft | null;
  /** `null` clears the pick (back to the class step). */
  'class-selection': ClassSelection | null;
  /** Remaining session time of the select (60 s) or reveal (10 s) countdown. */
  countdown: { readonly kind: 'select' | 'reveal'; readonly remainingMs: number };
  'match-clock': MatchClock;
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
  /** The whole settings state, published whenever it changes. */
  settings: SettingsSliceState;
};
