import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { StructureKind } from '../content/structures/structures.types';
import type { GameState } from '../state/GameState';
import type { PlayableTeam } from '../teams/teams.types';
import type { System, SystemContext } from './System.types';

/**
 * Enrages a lane's minions when their team loses a tower on it (architecture 07 §8, 18 MS-16,
 * `balancing.md` "Enraged buff on structure loss"): each lost enraging structure adds one
 * `enraged` stack to the team's minions already on that lane and to every horde spawned there
 * later, for the rest of the match. It records the loss per team and lane in
 * `TeamState.towersLostByLane`, so it is hashed and replayed, and `MinionStrengthStep` reads the
 * same count (DISC-24's shift). Runs after `SpawnSystem`, so a horde spawned this tick is covered.
 *
 * @remarks ponytail: no structure can fall until structure entities exist (minion plan M2c), so
 * in a live match nothing emits `structure-destroyed` yet.
 */
export class EnragedSystem implements System {
  public readonly name = 'enraged';
  private readonly lost: { readonly team: PlayableTeam; readonly lane: string }[] = [];
  private readonly spawned: string[] = [];

  /**
   * @param state - The match whose events this system listens to.
   * @param statuses - The match's one status applier.
   * @param enraging - The structure kinds whose loss enrages a lane.
   */
  public constructor(
    state: GameState,
    private readonly statuses: StatusEffectApplier,
    enraging: readonly StructureKind[],
  ) {
    state.events.on('structure-destroyed', ({ kind, team, lane }) => {
      const isEnraging = enraging.some((enragingKind) => enragingKind === kind);
      if (isEnraging && lane !== null && (team === 'light' || team === 'dark')) {
        this.lost.push({ team, lane });
      }
    });
    state.events.on('horde-spawned', ({ hordeId }) => {
      this.spawned.push(hordeId);
    });
  }

  /**
   * Gives new hordes their lane's stacks, then adds this tick's losses to every horde on the lane
   * (new ones included), so a horde never gets a stack twice.
   */
  public update({ state }: SystemContext): void {
    for (const hordeId of this.spawned) {
      const horde = state.hordes.get(hordeId);
      if (horde !== undefined) {
        this.enrage(
          state,
          horde.memberIds,
          state.teams[horde.team].towersLostByLane[horde.lane] ?? 0,
        );
      }
    }
    for (const { team, lane } of this.lost) {
      const byLane = state.teams[team].towersLostByLane;
      byLane[lane] = (byLane[lane] ?? 0) + 1;
      state.hordes.forEach((horde) => {
        if (horde.team === team && horde.lane === lane) {
          this.enrage(state, horde.memberIds, 1);
        }
      });
    }
    this.lost.length = 0;
    this.spawned.length = 0;
  }

  private enrage(state: GameState, memberIds: readonly string[], stacks: number): void {
    for (const memberId of memberIds) {
      for (let stack = 0; stack < stacks; stack += 1) {
        this.statuses.apply(state, memberId, 'enraged', null);
      }
    }
  }
}
