import type { AbilityRegistry } from '../abilities/AbilityRegistry';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type {
  AuthoredGuardPlan,
  StructureDefinition,
} from '../content/structures/structures.types';
import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { EntityFactory } from '../entities/EntityFactory';
import type { MatchDirector } from '../match/MatchDirector';
import type { SpaceIndex } from '../physics/SpaceIndex';
import type { GameState } from '../state/GameState';
import type { LineOfFireQuery } from '../state/LineOfFire.types';
import type { SlotReadiness } from '../state/SlotReadiness.types';
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
  /**
   * The match's one entity factory (its ids come from one counter): it builds the shots ranged
   * attacks fire and, with `hordes`, the units spawned on lanes.
   */
  readonly factory: EntityFactory;
  /** The match's one line-of-fire query: `CombatSystem` fires a ranged attack only with it. */
  readonly lineOfFire: LineOfFireQuery;
  /** The content kills are priced and levels applied with, injected. */
  readonly progression: ProgressionContent;
  /** The match's director, built and started by `Simulation`; it runs after `DeathSystem`. */
  readonly director: Pick<MatchDirector, 'update'>;
  /**
   * The match's ability registry, shared with the `cast-ability` handler; the shipped abilities
   * (`createDefaultAbilityRegistry(loadAbilities(tickRate), tickRate)`) when omitted.
   */
  readonly abilities?: AbilityRegistry;
  /**
   * The match's one cast rule over `abilities`, as the `SlotReadiness` port it is to the
   * `cast-ability` handler, the snapshot and the bots (ADR 0026 decision 2); a new
   * `CastValidator` over `abilities` when omitted.
   */
  readonly validator?: SlotReadiness;
  /** Where a Duel's Legends start and return to after each kill; omitted outside a Duel. */
  readonly duelStarts?: Readonly<Record<PlayableTeam, Vec2>>;
  /** Whether `SpawnSystem` runs (SCRUM-445); `true` when omitted, `false` in a Duel's arena. */
  readonly spawnsMobs?: boolean;
  /**
   * The neighbour index and AI the horde systems (architecture 11, 18) need; without them nothing
   * decides, marches, steers or spawns on lanes.
   */
  readonly hordes?: {
    /** The index `state.space` exposes; `null` for a match without a map. */
    readonly space: SpaceIndex | null;
    /** Runs first: the AI, which `systems/` may not import, so `Simulation` composes it. */
    readonly decide: readonly System[];
    readonly collisions?: readonly System[];
    /**
     * Each guard home's plan by definition id, as authored (`loadGuardPlans` loads it);
     * `GUARD_PLANS` when omitted.
     */
    readonly guards?: Readonly<Record<string, AuthoredGuardPlan>>;
  };
  /**
   * Where each structure's definition, and so its breakability rule, is looked up;
   * `STRUCTURE_DEFINITIONS` when omitted. `Simulation` injects the one set it builds the
   * structures from.
   */
  readonly structures?: Pick<ContentCatalogue<StructureDefinition>, 'get'>;
  /**
   * How long an enemy hit still earns a gem kill (DEC-346): the assist window, from the scoring
   * `Simulation` loads once for the match.
   */
  readonly assistWindowTicks: number;
};
