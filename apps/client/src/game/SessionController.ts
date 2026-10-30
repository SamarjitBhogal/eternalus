import { type LogAttributes, makeLogRecord } from '@eternalus/core';

import type {
  AssetGroup,
  ClassSelection,
  FilledRosters,
  LoadingProgress,
  MatchSetupDraft,
  SessionPhase,
  SessionReason,
} from '../bridge/events';
import type { PreparedWorld } from './Match.types';
import type { MatchViewport } from './MatchViewport.types';
import { SESSION_TRANSITIONS } from './SessionController.constants';
import type {
  RunningMatch,
  SessionContext,
  SessionControllerDeps,
  SessionState,
} from './SessionController.types';
import { buildMatchSetup } from './session/buildMatchSetup';
import { fillRosters } from './session/fillRosters';
import { IllegalSessionTransition } from './session/IllegalSessionTransition';

/**
 * Owns the session phase machine (architecture 13 §2): boot → menu → loading → character-select
 * → pre-launch → match-loading → match → results. Each phase is a `SessionState`; UI intents go
 * to the current state; every phase change is checked against `SESSION_TRANSITIONS` and published
 * as `session-phase`. Owns the match's lifetime (DEC-50): `match-loading` prepares the world,
 * `attachViewport` in `match` creates the `Match`, leaving `match` destroys it. Loads and releases
 * the asset groups each phase needs through the resources facade. Keeps the setup as built (what a
 * rematch republishes) apart from the rosters LOCK IN fills (what the match is built from).
 */
export class SessionController {
  private current: SessionState | null = null;
  private setup: MatchSetupDraft | null = null;
  private selection: ClassSelection | null = null;
  private rosters: FilledRosters | null = null;
  private world: PreparedWorld | null = null;
  private readonly publishedGroups = new Set<AssetGroup>();
  private stopListening = (): void => undefined;
  private readonly context: SessionContext;

  /** Loads the content catalogue; nothing runs until `start()`. */
  public constructor(private readonly deps: SessionControllerDeps) {
    this.context = {
      bus: deps.bus,
      clock: deps.clock,
      catalogue: deps.catalogue.load(),
      credits: deps.credits,
      logger: deps.logger,
      transition: (to, reason) => {
        this.transition(to, reason ?? null);
      },
      newMatchSetup: () => {
        this.newMatchSetup();
      },
      repeatMatchSetup: () => {
        if (this.setup === null) throw new Error('No match setup to repeat');
        this.publishSetup(this.setup);
      },
      clearMatchSetup: () => {
        this.clearMatchSetup();
      },
      selection: () => this.selection,
      recordSelection: (selection) => {
        this.selection = selection;
        deps.bus.emit('class-selection', selection);
      },
      lockIn: () => {
        this.lockIn();
      },
      prepareWorld: () => {
        if (this.setup === null) throw new Error('No match setup to prepare a world for');
        this.world = deps.prepareWorld(this.setup.seed);
      },
      createMatch: (viewport) => this.createMatch(viewport),
      dropWorld: () => {
        this.world = null;
      },
      abortMatch: (error) => {
        this.logError('The match could not start.', { error: String(error) });
        this.transition('menu', 'match-failed');
      },
      loadAssets: (groups, onReady, onFailed) => this.loadAssets(groups, onReady, onFailed),
      releaseAssets: (group) => {
        this.releaseAssets(group);
      },
    };
  }

  /** The current phase; `null` before `start()` and after `destroy()`. */
  public get phase(): SessionPhase | null {
    return this.current?.phase ?? null;
  }

  /**
   * Marks the colour set on the theme root (DEC-55), subscribes to `ui-intent` and enters `boot`.
   */
  public start(): void {
    if (this.current !== null) throw new Error('SessionController is already started');
    this.deps.themeRoot.dataset.contrast = this.context.catalogue.contrastMode;
    this.stopListening = this.deps.bus.on('ui-intent', (intent) => {
      this.current?.handleIntent?.(intent, this.context);
    });
    this.enter('boot', null);
  }

  /**
   * Exits the current state (cancelling its timers and loads, destroying a running match),
   * unsubscribes and clears the colour set; safe to call twice.
   */
  public destroy(): void {
    this.current?.exit?.(this.context);
    this.current = null;
    this.stopListening();
    delete this.deps.themeRoot.dataset.contrast;
  }

  /**
   * `GameCanvas` calls this when its canvas mounts (architecture 13 §1); call the returned
   * function when it unmounts. Outside `match` it does nothing and returns a no-op.
   */
  public attachViewport(viewport: MatchViewport): () => void {
    const state = this.current;
    if (state?.attachViewport === undefined) return () => undefined;
    return state.attachViewport(viewport, this.context);
  }

  private transition(to: SessionPhase, reason: SessionReason | null): void {
    const from = this.current;
    if (from === null) throw new Error(`Session is not running; cannot enter '${to}'`);
    if (!SESSION_TRANSITIONS[from.phase].includes(to)) {
      throw new IllegalSessionTransition(from.phase, to);
    }
    from.exit?.(this.context);
    this.enter(to, reason);
  }

  private enter(phase: SessionPhase, reason: SessionReason | null): void {
    const state = this.deps.states[phase];
    this.current = state;
    this.deps.bus.emit('session-phase', { phase, reason });
    state.enter?.(this.context);
  }

  private newMatchSetup(): void {
    const seed = this.deps.seedSource();
    this.publishSetup(
      buildMatchSetup({
        seed,
        rng: this.deps.createRng(seed),
        legendClasses: this.context.catalogue.legendClasses,
        botRoster: this.context.catalogue.botRoster,
        legendsPerTeam: this.deps.matchConfig.legendsPerTeam,
        playerName: this.deps.playerName,
      }),
    );
  }

  /**
   * Every published setup starts clean: no pick, no filled rosters, no world (as
   * `connectBusToStore` resets the store).
   */
  private publishSetup(setup: MatchSetupDraft): void {
    this.setup = setup;
    this.selection = null;
    this.rosters = null;
    this.world = null;
    this.deps.themeRoot.dataset.team = setup.playerTeam;
    this.deps.bus.emit('match-setup', setup);
  }

  private clearMatchSetup(): void {
    this.setup = null;
    this.selection = null;
    this.rosters = null;
    this.world = null;
    delete this.deps.themeRoot.dataset.team;
    this.deps.bus.emit('match-setup', null);
  }

  private lockIn(): void {
    const { setup, selection } = this;
    if (setup === null || selection === null) throw new Error('LOCK IN needs a setup and a pick');
    const { legendClasses, botRoster } = this.context.catalogue;
    this.rosters = fillRosters({
      draft: setup,
      selection,
      legendClasses,
      enemyRover: botRoster.enemyRover,
      rng: this.deps.createRosterRng(setup.seed),
    });
    this.deps.bus.emit('selection-locked', this.rosters);
  }

  private createMatch(viewport: MatchViewport): RunningMatch {
    const { setup, selection, rosters, world } = this;
    if (setup === null || selection === null || rosters === null || world === null) {
      throw new Error('A match needs a setup, a locked-in selection and a prepared world');
    }
    return this.deps.createMatch(
      {
        setup: { ...setup, ...rosters },
        world,
        player: { legend: selection.classId, team: setup.playerTeam },
        captureKinds: this.context.catalogue.hud.objectiveKinds.map(({ kind }) => kind),
      },
      viewport,
    );
  }

  /** `SessionContext.loadAssets`: the groups one after another, each published when it is ready. */
  private loadAssets(
    groups: readonly AssetGroup[],
    onReady: () => void,
    onFailed: (error: unknown) => void,
  ): () => void {
    const { resources } = this.deps;
    let isCancelled = false;
    const step = (index: number): void => {
      const group = groups[index];
      if (group === undefined) {
        onReady();
        return;
      }
      if (resources.isLoaded(group)) {
        this.publishLoaded(group);
        step(index + 1);
        return;
      }
      this.publishProgress(group, 'loading');
      void resources
        .load(group, () => {
          if (!isCancelled) this.publishProgress(group, 'loading');
        })
        .then(
          () => {
            if (isCancelled) return;
            this.publishLoaded(group);
            step(index + 1);
          },
          (error: unknown) => {
            if (isCancelled) return;
            this.logError('An asset group could not load.', { group, error: String(error) });
            this.publishProgress(group, 'failed');
            onFailed(error);
          },
        );
    };
    step(0);
    return () => {
      isCancelled = true;
    };
  }

  private releaseAssets(group: AssetGroup): void {
    this.deps.resources.release(group);
    if (this.publishedGroups.delete(group)) {
      this.deps.bus.emit('asset-urls', { group, urls: {}, boxes: {} });
    }
  }

  /** `ready`, then the group's URLs and draw boxes, so the next screen's first render has them. */
  private publishLoaded(group: AssetGroup): void {
    this.publishProgress(group, 'ready');
    this.publishedGroups.add(group);
    const { resources } = this.deps;
    this.deps.bus.emit('asset-urls', {
      group,
      urls: resources.urls(group),
      boxes: resources.boxes(group),
    });
  }

  private publishProgress(group: AssetGroup, status: LoadingProgress['status']): void {
    const { loaded, total, loadedBytes, totalBytes } = this.deps.resources.progress(group);
    this.deps.bus.emit('loading-progress', {
      group,
      loaded,
      total,
      bytesLoaded: loadedBytes,
      bytesTotal: totalBytes,
      status,
    });
  }

  private logError(body: string, attributes: LogAttributes): void {
    this.deps.logger.log(makeLogRecord('ERROR', 'client.session', body, { attributes }));
  }
}
