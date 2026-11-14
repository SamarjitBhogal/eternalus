import type { AbilityRegistry } from '../abilities/AbilityRegistry';
import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { EntityFactory } from '../entities/EntityFactory';
import type { MatchDirector } from '../match/MatchDirector';
import type { SpaceIndex } from '../physics/SpaceIndex';
import type { GameState } from '../state/GameState';
import type { SlotReadiness } from '../state/SlotReadiness.types';
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
   * The match's ability registry, shared with the `cast-ability` handler; the shipped abilities
   * (`createDefaultAbilityRegistry(loadAbilities(tickRate))`) when omitted.
   */
  readonly abilities?: AbilityRegistry;
  /**
   * The match's one cast rule over `abilities`, as the `SlotReadiness` port it is to the
   * `cast-ability` handler, the snapshot and the bots (ADR 0026 decision 2); a new
   * `CastValidator` over `abilities` when omitted.
   */
  readonly validator?: SlotReadiness;
  /**
   * The factory (and its definitions), neighbour index and AI the horde systems (architecture 11,
   * 18) need; without them nothing decides, marches, steers or spawns on lanes.
   */
  readonly hordes?: {
    readonly factory: EntityFactory;
    /** The index `state.space` exposes; `null` for a match without a map. */
    readonly space: SpaceIndex | null;
    /** Runs first: the AI, which `systems/` may not import, so `Simulation` composes it. */
    readonly decide: readonly System[];
    readonly collisions?: readonly System[];
  };
};
