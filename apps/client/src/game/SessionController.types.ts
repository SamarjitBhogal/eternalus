import type { Logger, MapFeatureKind, RosterSlot, SeededRandom } from '@eternalus/core';

import type { DisplayCatalogue } from '../bridge/catalogue.types';
import type {
  AssetGroup,
  BridgeEventMap,
  ClassSelection,
  CreditEntry,
  MatchSetupDraft,
  SessionPhase,
  SessionReason,
  UiIntent,
} from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';
import type { ErrorReporter } from '../data/logging/ErrorReporter';
import type { MatchEvidence } from '../data/logging/ErrorReport.types';
import type { ResourceController } from '../data/resources/ResourceController';
import type { DuelLink } from './duel/DuelLink.types';
import type { CatalogueSource } from './content/CatalogueSource.types';
import type { MessageTransport } from './engine/net/MessageTransport';
import type { SessionClock } from './engine/time/SessionClock.types';
import type { MatchCrash, MatchObserver, PreparedWorld } from './Match.types';
import type { MatchViewport } from './MatchViewport.types';
import type { Rng } from './session/Rng.types';

/** What the session hands the match factory (architecture 13 §2 `createMatch(setup)`). */
export type MatchRequest = {
  /** The setup with its rosters; `setup.playerTeam` is the player's team (HC-F4). */
  readonly setup: MatchSetupDraft;
  /** The world prepared in `match-loading`; every Match built on it shares it and never changes it. */
  readonly world: PreparedWorld;
  /** Map-feature kinds the HUD lists as capture points: `catalogue.hud.objectiveKinds` (one list). */
  readonly captureKinds: readonly MapFeatureKind[];
  /**
   * The setup's rosters as the simulation's roster, the player as its human slot: `rosterSlots`
   * over the catalogue's difficulties.
   */
  readonly roster: readonly RosterSlot[];
  /**
   * Hears the match: `crashed` if its game loop stops because a tick or a frame threw (DEC-106),
   * `ended` once after the tick that ended it (`match-ended`; game-loop plan A8); the match runs on
   * until the session destroys it (DEC-92).
   */
  readonly observer: MatchObserver;
};

/** What the session hands the Duel match factory (ADR 0016): no roster, the server owns the match. */
export type DuelMatchRequest = {
  /** The Duel's world, built from the shared map seed. */
  readonly world: PreparedWorld;
  readonly captureKinds: readonly MapFeatureKind[];
  /** The started Duel: this player's Legend, the server's snapshots and the intent's way out. */
  readonly link: DuelLink;
  /**
   * Hears the match as `MatchRequest.observer` does. A Duel's `ended` is never called: the
   * server's `match-ended` message ends it (`DuelSession`).
   */
  readonly observer: MatchObserver;
};

/** A match that is running in `match`; only `MatchState` holds one. */
export interface RunningMatch {
  /** Stops the loop and releases every listener, device and adapter; safe to call twice. */
  destroy(): void;
  /**
   * Stops (`true`) or resumes (`false`) ticking and rendering; held input is released on pause
   * (13 §7; INBOX HC-Q8).
   */
  setPaused(isPaused: boolean): void;
  /**
   * What an error report needs from this match (ADR 0025 §3): its seed, tick, recent commands and
   * events, replay so far and log records. Only reads; works after a crash too. `null` for an
   * online Duel: its simulation runs on the server, so there is no replay to report.
   */
  evidence(): MatchEvidence | null;
  /** Ticks the simulation has completed; a cheap read, unlike `evidence()`, which copies the log. */
  currentTick(): number;
}

/**
 * Builds and starts one match on a viewport: the adapters, a fresh `Simulation` from the setup's
 * seed, the `Match` and its `MatchHost` (`createBrowserMatch` in the app).
 * @throws When it cannot (no 2D canvas, a map without the player's stronghold).
 */
export type MatchFactory = (request: MatchRequest, viewport: MatchViewport) => RunningMatch;

/**
 * Builds and starts an online Duel on a viewport: the same adapters, a `Match` over the server's
 * snapshots and its `MatchHost` (`createBrowserDuelMatch` in the app).
 * @throws When it cannot (no 2D canvas).
 */
export type DuelMatchFactory = (request: DuelMatchRequest, viewport: MatchViewport) => RunningMatch;

/** What the current `SessionState` may use and do. */
export interface SessionContext {
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly clock: SessionClock;
  readonly catalogue: DisplayCatalogue;
  /** The licence blocks of every bundled asset; `BootState` publishes them as `credits`. */
  readonly credits: readonly CreditEntry[];
  /**
   * The session's logger (`SessionControllerDeps.logger`): a state reports here what should never
   * happen, such as an intent naming an id the catalogue does not have.
   */
  readonly logger: Logger;
  /** Moves to `to` (exit current → enter next); throws on a pair not in `SESSION_TRANSITIONS`. */
  transition(to: SessionPhase, reason?: SessionReason): void;
  /** Draws a new seed and team, builds both rosters, themes the page and publishes the setup. */
  newMatchSetup(): void;
  /**
   * Whether there is a setup a rematch can repeat: a local match's. An online Duel's setup is the
   * server's seat and seed, so it is never repeated.
   */
  canRepeatMatchSetup(): boolean;
  /**
   * Publishes the current setup again, unchanged (a rematch, architecture 13 §2).
   * @throws Without a setup a rematch can repeat; ask `canRepeatMatchSetup` first.
   */
  repeatMatchSetup(): void;
  /**
   * Joins the online Duel queue (ADR 0016): connects to the server and sends `queue-join`. When an
   * opponent is found and the first snapshot arrives, the session moves to `match-loading`.
   */
  joinDuelQueue(): void;
  /** Leaves the Duel queue (`queue-leave`) and closes the connection. */
  leaveDuelQueue(): void;
  /**
   * Drops the setup, the selection, the prepared world and the team theme, and closes any Duel
   * connection (the menu is where every match ends up).
   */
  clearMatchSetup(): void;
  /** The player's pick for the current setup, or `null` (13 §2 `character-select` records it). */
  selection(): ClassSelection | null;
  /** Records the pick, or clears it with `null`, and publishes `class-selection`. */
  recordSelection(selection: ClassSelection | null): void;
  /**
   * LOCK IN (DEC-61): fills both rosters from the setup and the pick (`fillRosters`) and publishes
   * them as `selection-locked`. The setup itself stays as built, for a rematch.
   * @throws Without a setup or a pick.
   */
  lockIn(): void;
  /**
   * Builds the world for the current setup's seed (06 §1: the generator runs before `Simulation`);
   * a Duel's setup carries the server's map seed.
   * @throws Without a setup, or when generation fails.
   */
  prepareWorld(): void;
  /**
   * Builds and starts the match on `viewport` from the setup with the rosters LOCK IN filled, the
   * selection and the world, or the online Duel (ADR 0016) while one is started; `observer` hears
   * it crash or (a local match) end (`MatchRequest.observer`); the server ends a Duel.
   * @throws When one of them is missing or the factory fails.
   */
  createMatch(viewport: MatchViewport, observer: MatchObserver): RunningMatch;
  /** Drops the prepared world (the match is over). */
  dropWorld(): void;
  /** Logs why the match could not start and returns to `menu` with reason `'match-failed'` (13 §2). */
  abortMatch(error: unknown): void;
  /**
   * A running match crashed: logs FATAL `client.session` with the error, its stack, the seed and
   * the tick, reports the crash with its match evidence (source `'game-loop'`), opens the crash
   * popup, then returns to `menu` with reason `'match-crashed'` (DEC-106, ADR 0025; 13 §2 `match`
   * row).
   */
  endCrashedMatch(crash: MatchCrash): void;
  /**
   * Loads `groups` in order: `loading-progress` while loading, then `ready` and `asset-urls` per
   * group, then `onReady` once. Synchronous when nothing is left to load. An unexpected rejection
   * (a bug: asset failures never reject) logs ERROR `client.session`, publishes `loading-progress`
   * `failed` and calls `onFailed`; `onReady` is then never called (13 §2 `loading` and
   * `match-loading` rows: a failed load returns to `menu` with a banner; 13 §10, Session).
   * @returns Cancels: neither callback is called afterwards.
   */
  loadAssets(
    groups: readonly AssetGroup[],
    onReady: () => void,
    onFailed: (error: unknown) => void,
  ): () => void;
  /** Releases `group` and publishes its empty `asset-urls` (a never-loaded group is a no-op). */
  releaseAssets(group: AssetGroup): void;
}

/** One session phase's behaviour (State pattern). One instance per phase, reused across visits. */
export interface SessionState {
  readonly phase: SessionPhase;
  enter?(context: SessionContext): void;
  exit?(context: SessionContext): void;
  handleIntent?(intent: UiIntent, context: SessionContext): void;
  /**
   * The match screen's canvas mounted (13 §1). Returns what to run when it unmounts. Only the
   * `match` state implements it; in every other phase an attach does nothing.
   */
  attachViewport?(viewport: MatchViewport, context: SessionContext): () => void;
  /** The running match's `evidence()`, or `null`; only the `match` state implements it. */
  matchEvidence?(): MatchEvidence | null;
  /** The running match's `currentTick()`, or `null`; only the `match` state implements it. */
  matchTick?(): number | null;
}

/** The part of core's `MatchConfig` the session needs. */
type SessionMatchConfig = { readonly legendsPerTeam: number };

/** Everything `SessionController` is built from; `main.tsx` passes real adapters, tests fakes. */
export type SessionControllerDeps = {
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly clock: SessionClock;
  /** `createDefaultSessionStates()`, the only list of the concrete states. */
  readonly states: Readonly<Record<SessionPhase, SessionState>>;
  readonly catalogue: CatalogueSource;
  readonly matchConfig: SessionMatchConfig;
  readonly playerName: string;
  /** A fresh match seed. */
  readonly seedSource: () => number;
  /** The match's random stream from its seed. */
  readonly createRng: (seed: number) => Rng;
  /**
   * The stream LOCK IN draws the bots' Legends from (`fillRosters`), apart from `createRng`'s team
   * draw: `session/createRosterRng.ts`. Its own factory because core's `nextInt(min, max)` is not
   * the `Rng` port's `nextInt(maxExclusive)`.
   */
  readonly createRosterRng: (seed: number) => Pick<SeededRandom, 'nextInt'>;
  /**
   * Receives `data-team="light|dark"` while a match setup exists and `data-contrast` (the
   * catalogue's colour set, DEC-55) while the session runs (`<html>` in the app).
   */
  readonly themeRoot: Pick<HTMLElement, 'dataset'>;
  /** Builds a match's world from its seed (`prepareMatchWorld` over the page's `GameConfig`). */
  readonly prepareWorld: (seed: number) => PreparedWorld;
  /** Builds and starts a match on a viewport. */
  readonly createMatch: MatchFactory;
  /** Builds and starts an online Duel on a viewport (ADR 0016). */
  readonly createDuelMatch: DuelMatchFactory;
  /** A new, unconnected transport to the Duel server per Duel (`WebSocketTransport` in the app). */
  readonly createDuelTransport: () => MessageTransport;
  /** Where the session reports a match that could not start or a load bug. */
  readonly logger: Logger;
  /**
   * The resources facade; a structural type so a test can inject a rejecting stub (13 §2: a failed
   * load returns to `menu`).
   */
  readonly resources: Pick<
    ResourceController,
    'load' | 'urls' | 'boxes' | 'release' | 'isLoaded' | 'progress'
  >;
  /** The licence blocks of every bundled asset (`describeCredits` over the manifest). */
  readonly credits: readonly CreditEntry[];
  /** Where a crash is reported and its note saved (ADR 0025 §3; the page's `ErrorReporter`). */
  readonly reporter: Pick<ErrorReporter, 'reportCrash' | 'addNote'>;
};
