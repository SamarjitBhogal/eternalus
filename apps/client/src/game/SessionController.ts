import type { SessionPhase } from '../bridge/events';
import { SESSION_TRANSITIONS } from './SessionController.constants';
import type {
  SessionContext,
  SessionControllerDeps,
  SessionState,
} from './SessionController.types';
import { buildMatchSetup } from './session/buildMatchSetup';

/**
 * Owns the session phase machine (architecture 13 §2): boot → menu → loading → character-select
 * → pre-launch → match-loading → match → results. Each phase is a `SessionState`; UI intents go
 * to the current state; every phase change is checked against `SESSION_TRANSITIONS` and published
 * as `session-phase`.
 */
export class SessionController {
  private current: SessionState | null = null;
  private stopListening = (): void => undefined;
  private readonly context: SessionContext;

  /** Loads the content catalogue; nothing runs until `start()`. */
  public constructor(private readonly deps: SessionControllerDeps) {
    this.context = {
      bus: deps.bus,
      clock: deps.clock,
      catalogue: deps.catalogue.load(),
      transition: (to, reason) => {
        this.transition(to, reason ?? null);
      },
      newMatchSetup: () => {
        this.newMatchSetup();
      },
      clearMatchSetup: () => {
        this.clearMatchSetup();
      },
    };
  }

  /** The current phase; `null` before `start()` and after `destroy()`. */
  public get phase(): SessionPhase | null {
    return this.current?.phase ?? null;
  }

  /** Subscribes to `ui-intent` and enters `boot`. */
  public start(): void {
    if (this.current !== null) throw new Error('SessionController is already started');
    this.stopListening = this.deps.bus.on('ui-intent', (intent) => {
      this.current?.handleIntent?.(intent, this.context);
    });
    this.enter('boot', null);
  }

  /** Exits the current state (cancelling its timers) and unsubscribes; safe to call twice. */
  public destroy(): void {
    this.current?.exit?.(this.context);
    this.current = null;
    this.stopListening();
  }

  private transition(to: SessionPhase, reason: string | null): void {
    const from = this.current;
    if (from === null) throw new Error(`Session is not running; cannot enter '${to}'`);
    if (!SESSION_TRANSITIONS[from.phase].includes(to)) {
      throw new Error(`Illegal session transition: ${from.phase} → ${to}`);
    }
    from.exit?.(this.context);
    this.enter(to, reason);
  }

  private enter(phase: SessionPhase, reason: string | null): void {
    const state = this.deps.states[phase];
    this.current = state;
    this.deps.bus.emit('session-phase', { phase, reason });
    state.enter(this.context);
  }

  private newMatchSetup(): void {
    const seed = this.deps.seedSource();
    const setup = buildMatchSetup({
      seed,
      rng: this.deps.createRng(seed),
      legendClasses: this.context.catalogue.legendClasses,
      legendsPerTeam: this.deps.matchConfig.legendsPerTeam,
      playerName: this.deps.playerName,
    });
    this.deps.themeRoot.dataset.team = setup.playerTeam;
    this.deps.bus.emit('match-setup', setup);
  }

  private clearMatchSetup(): void {
    delete this.deps.themeRoot.dataset.team;
    this.deps.bus.emit('match-setup', null);
  }
}
