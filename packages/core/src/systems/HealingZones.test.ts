import { describe, expect, it } from 'vitest';

import { Footprint } from '../components/Footprint';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { GameConfig } from '../config/GameConfig.types';
import { OUT_OF_COMBAT_HEALING } from '../content/healing/outOfCombatHealing';
import type { MapDefinition, MapFeature, MapFeatureKind } from '../content/maps/maps.types';
import type { Entity } from '../entities/Entity';
import { Structure } from '../entities/structures/Structure';
import { MapGenerator } from '../map/MapGenerator';
import { MapObjectBuilder } from '../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../map/MapPresentationBuilder';
import { strongholdEnclosure } from '../map/strongholdEnclosure';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import type { PlayableTeam } from '../teams/teams.types';
import { distance, doesPolygonOverlapRect, isPointInPolygon, lerpPoint } from '../utils/geometry';
import type { Polygon, Rect, Vec2 } from '../utils/geometry.types';
import { HealingZones } from './HealingZones';
import type { HealingZone } from './HealingZones.types';

/** Half a metre: "just inside" and "just outside" an edge. */
const EDGE = 0.5;

/** A match's state with its structures (lane towers with their fort `Footprint`s) built. */
const matchOf = (config: GameConfig): { map: MapDefinition; state: GameState } => {
  const map = new MapGenerator().generate(config, 1);
  const state = new GameState(config, 1, matchWorldOf(map));
  spawnMapStructures(
    state,
    new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map)),
  );
  return { map, state };
};

const DEFAULT = matchOf(createDefaultGameConfig());
const ZONES = new HealingZones(DEFAULT.map);

const structure = (state: GameState, kind: string, team: PlayableTeam): Entity => {
  let found: Entity | undefined;
  state.entities.forEach((entity) => {
    if (entity.kind === kind && state.entities.teamOf(entity.id) === team) found ??= entity;
  });
  if (found === undefined) throw new Error('no structure');
  return found;
};

/** Every zone of the structures the content gives a bonus, with the structure's id. */
const zonesOf = (state: GameState, zones: HealingZones): [string, HealingZone][] => {
  const found: [string, HealingZone][] = [];
  state.entities.forEach((entity) => {
    if (!(entity instanceof Structure)) return;
    const bonus = OUT_OF_COMBAT_HEALING.structureBonuses[entity.kind];
    const zone = bonus && zones.zoneOf(bonus.zone, entity, state.entities.teamOf(entity.id));
    if (zone !== undefined) found.push([entity.id, zone]);
  });
  return found;
};

const boxOf = (outline: Polygon): Rect => {
  const xs = outline.map(({ x }) => x);
  const ys = outline.map(({ y }) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};

/**
 * Whether two outlines may overlap: each against the box round the other. Exact when either one is
 * a box (a lane tower's zone); for two Strongholds it may say yes where they only come close.
 */
const mayOverlap = (a: Polygon, b: Polygon): boolean =>
  doesPolygonOverlapRect(a, boxOf(b)) && doesPolygonOverlapRect(b, boxOf(a));

const shieldOf = (team: PlayableTeam, kinds: readonly MapFeatureKind[]): MapFeature[] =>
  DEFAULT.map.features.filter(({ kind, team: owner }) => owner === team && kinds.includes(kind));

const isOn = (point: Vec2, pieces: readonly MapFeature[]): boolean =>
  pieces.some(({ footprint }) => footprint !== undefined && isPointInPolygon(point, footprint));

describe('HealingZones', () => {
  it.each([
    ['1 lane', { numLanes: 1, campsPerSide: 0 }],
    ['3 lanes', {}],
    ['5 lanes', { numLanes: 5 }],
    ['7 lanes', { numLanes: 7 }],
  ])(
    'gives no two structures overlapping zones on the generated map (%s, DEC-215 (1))',
    (_name, map) => {
      const config = createDefaultGameConfig({ map });
      const { state, map: definition } = matchOf(config);
      const zones = zonesOf(state, new HealingZones(definition));
      const { numLanes, spawnTowersPerLane, buffTowersPerLane } = config.map;

      expect(zones).toHaveLength(2 * numLanes * (spawnTowersPerLane + buffTowersPerLane) + 2);

      const overlaps = zones.flatMap(([id, zone], index) =>
        zones
          .slice(index + 1)
          .filter(([, other]) => mayOverlap(zone.outline, other.outline))
          .map(([otherId]) => `${id} and ${otherId}`),
      );

      expect(overlaps).toEqual([]);
    },
  );

  it.each(['spawner-tower', 'buff-tower'])(
    "makes a %s's zone the box round its fort walls: court, walls and gateways in, nothing outside",
    (kind) => {
      const fort = structure(DEFAULT.state, kind, 'light');
      const { bounds, polygons } = fort.getComponent(Footprint);
      const zone = ZONES.zoneOf('fort-box', fort, 'light');
      const middle = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const westGateway = { x: bounds.x + EDGE, y: middle.y };
      const southGateway = { x: middle.x, y: bounds.y + bounds.height - EDGE };
      const corner = polygons[0]?.[0] ?? middle;

      // The gateway points stand in a gap of the fort's walls, not on a wall.
      for (const gateway of [westGateway, southGateway]) {
        expect(polygons.some((polygon) => isPointInPolygon(gateway, polygon))).toBe(false);
      }
      for (const point of [middle, westGateway, southGateway, corner]) {
        expect(zone?.contains(point)).toBe(true);
      }
      for (const point of [
        { x: bounds.x - EDGE, y: middle.y },
        { x: middle.x, y: bounds.y + bounds.height + EDGE },
      ]) {
        expect(zone?.contains(point)).toBe(false);
      }
    },
  );

  it.each([
    ['light', 1],
    ['dark', -1],
  ] as const)(
    "makes the %s Stronghold's zone the ground inside its shield: in front and behind it, up to the cliffs",
    (team, ahead) => {
      const stronghold = structure(DEFAULT.state, 'stronghold', team);
      const zone = ZONES.zoneOf('stronghold-interior', stronghold, team);
      const feature = shieldOf(team, ['stronghold'])[0];
      if (feature?.wallBoundary === undefined) throw new Error('no stronghold');
      const { position, wallBoundary } = feature;
      const inner = wallBoundary.radius - wallBoundary.thickness / 2;
      const outer = wallBoundary.radius + wallBoundary.thickness / 2;
      const tip = shieldOf(team, ['turret']).reduce((a, b) =>
        b.position.y < a.position.y ? b : a,
      );

      expect(zone?.contains(position)).toBe(true);
      expect(zone?.contains({ x: position.x + ahead * (inner - EDGE), y: position.y })).toBe(true);
      // Behind the end of the arc, between the turret and the cliff.
      expect(zone?.contains({ x: tip.position.x - ahead * 20, y: tip.position.y })).toBe(true);
      expect(zone?.contains({ x: position.x + ahead * (outer + EDGE), y: position.y })).toBe(false);
    },
  );

  it.each([
    ['light', 1],
    ['dark', -1],
  ] as const)(
    "keeps the %s shield's walls, gates and turrets out of its Stronghold's zone (DEC-215 (2), (5))",
    (team, ahead) => {
      const stronghold = structure(DEFAULT.state, 'stronghold', team);
      const zone = ZONES.zoneOf('stronghold-interior', stronghold, team);
      const walls = shieldOf(team, ['wall-segment', 'gate']);
      const turrets = shieldOf(team, ['turret']);
      const feature = shieldOf(team, ['stronghold'])[0];
      if (feature === undefined) throw new Error('no stronghold');
      const centre = feature.position;
      const front = turrets.reduce((a, b) =>
        Math.abs(b.position.x - centre.x) > Math.abs(a.position.x - centre.x) ? b : a,
      );
      const tip = turrets.reduce((a, b) => (b.position.y < a.position.y ? b : a));
      const length = distance(front.position, centre);
      // 6.5 m from the front turret's centre toward the Stronghold: past the wall, on the turret.
      const turretInside = lerpPoint(front.position, centre, 6.5 / length);
      // 4 m behind the end of the arc, on the tip turret: a turret tip past the shield arc.
      const turretTip = { x: tip.position.x - ahead * 4, y: tip.position.y };
      const enclosure = strongholdEnclosure(DEFAULT.map, feature) ?? [];

      expect(walls.length).toBeGreaterThan(0);
      expect(
        [...walls, ...turrets].filter(({ position }) => zone?.contains(position) !== false),
      ).toEqual([]);
      for (const point of [turretInside, turretTip]) {
        // On a turret only, and inside what the arc and the cliffs enclose.
        expect(isOn(point, walls)).toBe(false);
        expect(isOn(point, turrets)).toBe(true);
        expect(isPointInPolygon(point, enclosure)).toBe(true);
        expect(zone?.contains(point)).toBe(false);
      }
    },
  );

  it('gives no zone to a tower without a fort, nor to a Stronghold without a map or a shield', () => {
    const tower = structure(DEFAULT.state, 'spawner-tower', 'light');
    const bare = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
    spawnMapStructures(bare);
    const stronghold = structure(DEFAULT.state, 'stronghold', 'light');

    expect(
      ZONES.zoneOf('fort-box', structure(bare, 'spawner-tower', 'light'), 'light'),
    ).toBeUndefined();
    expect(ZONES.zoneOf('fort-box', tower, 'light')).toBeDefined();
    expect(
      new HealingZones(undefined).zoneOf('stronghold-interior', stronghold, 'light'),
    ).toBeUndefined();
    expect(
      new HealingZones(TWO_LANE_MAP).zoneOf('stronghold-interior', stronghold, 'light'),
    ).toBeUndefined();
    expect(ZONES.zoneOf('stronghold-interior', stronghold, 'neutral')).toBeUndefined();
    expect(ZONES.zoneOf('stronghold-interior', stronghold, undefined)).toBeUndefined();
  });
});
