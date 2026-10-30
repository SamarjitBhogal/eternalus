import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { MatchDirector } from '../match/MatchDirector';
import type { GameState } from '../state/GameState';
import type { ProgressionContent } from './ProgressionSystem.types';
import type { System } from './System.types';

/** What the default pipeline is built from. */
export type DefaultSystemPipelineOptions = {
  /** The runner the last system checks with. */
  readonly invariants: InvariantRunner;
  /**
   * The match; its config sets the tick rate and lane structure count statuses load with, and
   * systems that listen to its events subscribe here.
   */
  readonly state: GameState;
  /** The content kills are priced and levels applied with, injected. */
  readonly progression: ProgressionContent;
  /** The match's director, built and started by `Simulation`; it runs after `DeathSystem`. */
  readonly director: Pick<MatchDirector, 'update'>;
  /**
   * PROTOTYPE(PROTO-01) TEMPORARY: remove once the owner decides where `AiSystem` lives and it is
   * registered like any other system. Systems that run first, before movement: `AiSystem`, which
   * `systems/` may not import, so `Simulation` passes it in.
   */
  readonly decide?: readonly System[];
};
