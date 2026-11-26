import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { timelineFrameOf } from '../../config/timelineFrameOf';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { MAP_FEATURE_DEFINITIONS } from '../../content/maps/mapFeatureDefinitions';
import { loadProjectiles } from '../../content/projectiles/loadProjectiles';
import { loadTurrets } from '../../content/structures/loadTurrets';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { SpaceIndex } from '../../physics/SpaceIndex';
import { matchWorldOf } from '../../state/__fixtures__/matchWorld';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../../state/AiState.types';
import type { EntityId } from '../../state/EntityStore.types';
import { GameState } from '../../state/GameState';
import type { LineOfFireQuery } from '../../state/LineOfFire.types';
import type { Team } from '../../teams/teams.types';
import { IdGenerator } from '../../utils/IdGenerator';
import { Unit } from '../../entities/Unit';
import { Perception } from '../perception/Perception';
import { TurretController } from '../TurretController';

/** The tick rate every content table here is loaded at: speeds are in metres per tick of it. */
export const TICK_RATE = 30;
export const PROJECTILES = loadProjectiles(TICK_RATE);
export const TURRETS = loadTurrets(TICK_RATE);
/** A line of fire that is clear to every target. */
export const CLEAR: LineOfFireQuery = { isClear: () => true };
export const controller = new TurretController({
  profiles: TURRETS.profiles,
  projectiles: PROJECTILES,
  lineOfFire: CLEAR,
});
export const PYLON = MAP_FEATURE_DEFINITIONS.turret?.footprintRadius ?? 0;
export const RANGE = 14;
/** The light turret stands here; units are placed by their distance east of it. */
export const AT = { x: 100, y: 30 };

/**
 * A light wall turret (or, with `carrierId`, a lane tower) on the two-lane map with a space index; `add` places units east of it, and
 * `hit` makes a Legend hit another (a `damage-applied` event at the current tick). The turret's
 * controller reads `lineOfFire`.
 */
export const setUp = (
  lineOfFire: LineOfFireQuery = CLEAR,
  projectiles: Pick<typeof PROJECTILES, 'get'> = PROJECTILES,
  carrierId = 'turret',
) => {
  const config = createDefaultGameConfig();
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(
    config,
    1,
    matchWorldOf(TWO_LANE_MAP),
    { space },
    { countdownEndTick: timelineFrameOf(config).countdownEndTick },
  );
  const units = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(TICK_RATE),
    undefined,
    loadWeapons(TICK_RATE),
  );
  const structures = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    new IdGenerator(1000),
    null,
    null,
    TURRETS.ammo,
  );
  const carrierProfile = carrierId === 'turret' ? 'wall-turret' : 'lane-tower';
  const turret = structures.create(carrierId, carrierId, { team: 'light', position: AT });
  state.entities.add(turret);
  const add = (team: Team, east: number, kind = 'light-mob', id = 'light-minion', y = AT.y) => {
    const entity = units.create(kind, id, { team, position: { x: AT.x + east, y } });
    state.entities.add(entity);
    return entity.id;
  };
  /** Refills the index the way `SpaceSystem` does: every unit (no structure), in store order. */
  const index = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      if (entity instanceof Unit) {
        const { x, y } = entity.getComponent(Transform).position;
        space.add(entity.id, x, y);
      }
    });
    space.commit();
  };
  const perception = new Perception(state);
  const turretController =
    lineOfFire === CLEAR && projectiles === PROJECTILES
      ? controller
      : new TurretController({ profiles: TURRETS.profiles, projectiles, lineOfFire });
  const decide = (memory: AiMemory = {}, profileId = carrierProfile) => {
    index();
    return turretController.decide({
      state,
      entityId: turret.id,
      perception,
      brain: {
        controllerId: 'turret',
        profileId,
        memory,
        rngState: { seed: 1, words: [1, 2, 3, 4] as const },
      },
    });
  };
  const advance = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      state.advanceTick();
    }
  };
  const hit = (attackerId: EntityId, targetId: EntityId) => {
    state.events.emit('damage-applied', {
      targetId,
      amount: 10,
      absorbed: 0,
      source: { attackerId, kind: 'weapon', definitionId: 'test' },
    });
  };
  return { state, turret, structures, add, index, decide, advance, hit };
};
