import type { BridgeEventMap, ContentCatalogue, SessionPhase, UiIntent } from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';
import type { CatalogueSource } from './content/CatalogueSource.types';
import type { SessionClock } from './engine/time/SessionClock.types';
import type { Rng } from './session/Rng.types';

/** What the current `SessionState` may use and do. */
export interface SessionContext {
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly clock: SessionClock;
  readonly catalogue: ContentCatalogue;
  /** Moves to `to` (exit current → enter next); throws on a pair not in `SESSION_TRANSITIONS`. */
  transition(to: SessionPhase, reason?: string): void;
  /** Draws a new seed and team, builds both rosters, themes the page and publishes the setup. */
  newMatchSetup(): void;
  /** Drops the setup and the team theme. */
  clearMatchSetup(): void;
}

/** One session phase's behaviour (State pattern). One instance per phase, reused across visits. */
export interface SessionState {
  readonly phase: SessionPhase;
  enter(context: SessionContext): void;
  exit?(context: SessionContext): void;
  handleIntent?(intent: UiIntent, context: SessionContext): void;
}

/** The part of core's `MatchConfig` the session needs. */
export type SessionMatchConfig = { readonly legendsPerTeam: number };

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
  /** Receives `data-team="light|dark"` while a match setup exists (`<html>` in the app). */
  readonly themeRoot: Pick<HTMLElement, 'dataset'>;
};
