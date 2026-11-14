import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import type { StructureDefinition } from '../content/structures/structures.types';
import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { EntityFactory } from '../entities/EntityFactory';
import type { MatchDirector } from '../match/MatchDirector';
import type { SpaceIndex } from '../physics/SpaceIndex';
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
  /**
   * Where each structure's definition, and so its breakability rule, is looked up;
   * `STRUCTURE_DEFINITIONS` when omitted. `Simulation` injects the one set it builds the
   * structures from.
   */
  readonly structures?: Pick<ContentCatalogue<StructureDefinition>, 'get'>;
  /**
   * What a standing wall of a lane tower's fort becomes when its tower falls (DEC-219 (a)).
   * `Simulation` passes the definition it registers with the entity factory. Required, so a
   * match with map objects (`state.worldObjects`) can never lack it; a match without them ignores it.
   */
  readonly ruinWall: ObstacleDefinition;
};
