import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { EntityFactory } from '../entities/EntityFactory';
import type { MatchDirector } from '../match/MatchDirector';
import type { SpaceIndex } from '../physics/SpaceIndex';
import type { GameState } from '../state/GameState';
import type { ProgressionContent } from './ProgressionSystem.types';
import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
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
  /** Where a Duel's Legends start and return to after each kill; omitted outside a Duel. */
  readonly duelStarts?: Readonly<Record<PlayableTeam, Vec2>>;
  readonly hordes?: {
    readonly factory: EntityFactory;
    /** The index `state.space` exposes; `null` for a match without a map. */
    readonly space: SpaceIndex | null;
    /** Runs first: the AI, which `systems/` may not import, so `Simulation` composes it. */
    readonly decide: readonly System[];
    readonly collisions?: readonly System[];
  };
};
