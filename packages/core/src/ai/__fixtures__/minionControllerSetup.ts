import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { AGGRO_RULES } from '../../content/ai/aggro/aggroRules';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { SpaceIndex } from '../../physics/SpaceIndex';
import { matchWorldOf } from '../../state/__fixtures__/matchWorld';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../../state/AiState.types';
import { GameState } from '../../state/GameState';
import { IdGenerator } from '../../utils/IdGenerator';
import { MinionController } from '../MinionController';
import { Perception } from '../perception/Perception';

const CLASS_OF = (kind: string) =>
  kind === 'warrior' ? ('legend' as const) : kind.endsWith('-mob') ? ('minion' as const) : null;

/** A lane-minion controller over the default aggro content. */
export const controller = new MinionController({
  aggro: AGGRO_RULES,
  classOf: CLASS_OF,
});

/**
 * A two-lane match with a space index: `add` places units, `decide` runs the controller for one
 * mob, `objective` gives a light horde a dark lane-0 structure to march on.
 */
export const setUp = () => {
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), { space });
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
  const perception = new Perception(state);
  const add = (
    team: 'light' | 'dark',
    x: number,
    y = 20,
    kind = 'light-mob',
    id = 'light-minion',
  ) => {
    const entity = factory.create(kind, id, { team, position: { x, y } });
    state.entities.add(entity);
    return entity.id;
  };
  /** Refills the index the way `SpaceSystem` does: every unit, in store order. */
  const index = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
  };
  const decide = (entityId: string, memory: AiMemory = {}, profileId = 'lane-minion') => {
    index();
    return controller.decide({
      state,
      entityId,
      perception,
      brain: {
        controllerId: 'minion',
        profileId,
        memory,
        rngState: { seed: 1, words: [1, 2, 3, 4] as const },
      },
    });
  };
  const moveTo = (entityId: string, x: number) => {
    const transform = state.entities.get(entityId)?.getComponent(Transform);
    transform?.moveBy({ x: x - transform.position.x, y: 0 });
  };
  const advance = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      state.advanceTick();
    }
  };
  const structures = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    new IdGenerator(1000),
  );
  /** Adds a dark structure on lane-0, indexes the structures and puts `memberId` in a light horde. */
  const objective = (definitionId: string, x: number, memberId: string, progress = 0) => {
    const entity = structures.create(STRUCTURE_DEFINITIONS.get(definitionId).kind, definitionId, {
      team: 'dark',
      position: { x, y: 20 },
      laneId: 'lane-0',
    });
    state.entities.add(entity);
    state.indexStructures();
    state.hordes.add({
      id: state.hordes.nextId(),
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [memberId],
      progress,
    });
    return entity;
  };
  return { state, add, decide, advance, moveTo, objective };
};

/** A minion's memory while it fights `targetId`, its leash anchored at (50, 20). */
export const engagingOn = (targetId: string, overrides: Partial<Record<string, number>> = {}) => ({
  fsm: 'engaging',
  targetId,
  breakAtTick: 0,
  cooldownUntilTick: 0,
  leashX: 50,
  leashY: 20,
  ...overrides,
});
