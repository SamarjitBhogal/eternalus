import type { Logger, MapFeatureKind } from '@eternalus/core';

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
import type { ResourceController } from '../data/resources/ResourceController';
import type { CatalogueSource } from './content/CatalogueSource.types';
import type { SessionClock } from './engine/time/SessionClock.types';
import type { PlayerChoice, PreparedWorld } from './Match.types';
import type { MatchViewport } from './MatchViewport.types';
import type { Rng } from './session/Rng.types';

/** What the session hands the match factory (architecture 13 §2 `createMatch(setup)`). */
export type MatchRequest = {
  readonly setup: MatchSetupDraft;
  /** The player's class and team, from the selection and the setup (F4). */
  readonly player: PlayerChoice;
  /** The world prepared in `match-loading`; every Match built on it shares it and never changes it. */
  readonly world: PreparedWorld;
  /** Map-feature kinds the HUD lists as capture points: `catalogue.hud.objectiveKinds` (one list). */
  readonly captureKinds: readonly MapFeatureKind[];
};

/** A match that is running in `match`; only `MatchState` holds one. */
export interface RunningMatch {
  /** Stops the loop and releases every listener, device and adapter; safe to call twice. */
  destroy(): void;
  /** Stops (`true`) or resumes (`false`) ticking and rendering; held input is released on pause (I-48). */
  setPaused(isPaused: boolean): void;
}

/**
 * Builds and starts one match on a viewport: the adapters, a fresh `Simulation` from the setup's
 * seed, the `Match` and its `MatchHost` (`createBrowserMatch` in the app).
 * @throws When it cannot (no 2D canvas, a map without the player's stronghold).
 */
export type MatchFactory = (request: MatchRequest, viewport: MatchViewport) => RunningMatch;

/** What the current `SessionState` may use and do. */
export interface SessionContext {
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly clock: SessionClock;
  readonly catalogue: DisplayCatalogue;
  /** The licence blocks of every bundled asset; `BootState` publishes them as `credits`. */
  readonly credits: readonly CreditEntry[];
  /** Moves to `to` (exit current → enter next); throws on a pair not in `SESSION_TRANSITIONS`. */
  transition(to: SessionPhase, reason?: SessionReason): void;
  /** Draws a new seed and team, builds both rosters, themes the page and publishes the setup. */
  newMatchSetup(): void;
  /** Publishes the current setup again, unchanged (a rematch, architecture 13 §2). */
  repeatMatchSetup(): void;
  /** Drops the setup, the selection, the prepared world and the team theme. */
  clearMatchSetup(): void;
  /** The player's pick for the current setup, or `null` (13 §2 `character-select` records it). */
  selection(): ClassSelection | null;
  /** Records the pick, or clears it with `null`, and publishes `class-selection`. */
  recordSelection(selection: ClassSelection | null): void;
  /**
   * Builds the world for the current setup's seed (06 §1: the generator runs before `Simulation`).
   * @throws Without a setup, or when generation fails.
   */
  prepareWorld(): void;
  /**
   * Builds and starts the match on `viewport` from the setup, the selection and the world.
   * @throws When one of them is missing or the factory fails.
   */
  createMatch(viewport: MatchViewport): RunningMatch;
  /** Drops the prepared world (the match is over). */
  dropWorld(): void;
  /** Logs why the match could not start and returns to `menu` with reason `'match-failed'` (13 §2). */
  abortMatch(error: unknown): void;
  /**
   * Loads `groups` in order: `loading-progress` while loading, then `ready` and `asset-urls` per
   * group, then `onReady` once. Synchronous when nothing is left to load. An unexpected rejection
   * (a bug: asset failures never reject) logs ERROR `client.session`, publishes `loading-progress`
   * `failed` and calls `onFailed`; `onReady` is then never called (I-57).
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
   * Receives `data-team="light|dark"` while a match setup exists and `data-contrast` (the
   * catalogue's colour set, I-81) while the session runs (`<html>` in the app).
   */
  readonly themeRoot: Pick<HTMLElement, 'dataset'>;
  /** Builds a match's world from its seed (`prepareMatchWorld` over the page's `GameConfig`). */
  readonly prepareWorld: (seed: number) => PreparedWorld;
  /** Builds and starts a match on a viewport. */
  readonly createMatch: MatchFactory;
  /** Where the session reports a match that could not start or a load bug. */
  readonly logger: Logger;
  /** The resources facade; a structural type so a test can inject a rejecting stub (I-57). */
  readonly resources: Pick<
    ResourceController,
    'load' | 'urls' | 'release' | 'isLoaded' | 'progress'
  >;
  /** The licence blocks of every bundled asset (`describeCredits` over the manifest). */
  readonly credits: readonly CreditEntry[];
};
