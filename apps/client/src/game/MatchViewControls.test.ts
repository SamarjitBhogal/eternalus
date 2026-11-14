import {
  createDefaultGameConfig,
  type Command,
  type EntitySnapshot,
  type InputIntent,
  type MapObject,
  type MapObjectSnapshot,
  MapGenerator,
  MapPresentationBuilder,
  type Simulation,
  type Vec2,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { AbilityCasts } from './AbilityCasts';
import { Camera } from './engine/Camera';
import { BASE_ZOOM } from './engine/Camera.constants';
import { BuildingRoofs } from './BuildingRoofs';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import type { IntentSource } from './Match.types';
import { MatchCamera } from './MatchCamera';
import { MatchViewControls } from './MatchViewControls';
import { PlayerCommands } from './PlayerCommands';
import { MapView } from './views/MapView';
import { MiniMapView } from './views/MiniMapView';
import type { MiniMapRing } from './views/MiniMapView.types';

const MAP = new MapGenerator().generate(createDefaultGameConfig(), 1);
const { buildings } = new MapPresentationBuilder().build(MAP);

const ACTOR = 'legend-1';
const HOUSE_ENTITY = 'house-entity';
/** A point inside the cathedral's footprint on seed 1's map; the camera looks here. */
const IN_CATHEDRAL: Vec2 = { x: 800, y: 450 };
/** The map's top-left corner: open ground, outside every building. */
const OPEN_GROUND: Vec2 = { x: 0, y: 0 };
const CANVAS = { width: 1280, height: 720 };
const CENTER = { x: CANVAS.width / 2, y: CANVAS.height / 2 };

const RING: MiniMapRing = {
  frame: { width: 1920, height: 1080 },
  box: { right: 29, top: 47, width: 255, height: 244 },
  strokeWidth: 4,
};

/** One living house, 8 × 8, around the point the camera looks at. */
const HOUSE: MapObject = {
  id: 'house',
  kind: 'house',
  isBlocking: true,
  footprints: [
    [
      { x: IN_CATHEDRAL.x - 4, y: IN_CATHEDRAL.y - 4 },
      { x: IN_CATHEDRAL.x + 4, y: IN_CATHEDRAL.y - 4 },
      { x: IN_CATHEDRAL.x + 4, y: IN_CATHEDRAL.y + 4 },
      { x: IN_CATHEDRAL.x - 4, y: IN_CATHEDRAL.y + 4 },
    ],
  ],
};
const HOUSE_STATES: readonly MapObjectSnapshot[] = [
  { id: 'house', entityId: HOUSE_ENTITY, health: { current: 100, max: 100 }, isDestroyed: false },
];

/** A living mob of `team` at `at`, as a snapshot shows it. */
const unit = (id: string, team: 'light' | 'dark', at: Vec2): EntitySnapshot => ({
  id,
  kind: 'minion',
  family: 'mob',
  definitionId: 'minion',
  team,
  transform: { ...at, radius: 1 },
  health: { current: 10, max: 10 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
});
/** The player's Legend, away from the point the camera looks at. */
const PLAYER: EntitySnapshot = { ...unit(ACTOR, 'light', OPEN_GROUND), family: 'legend' };
/** A dark-team minion on the house, under the cathedral's roof. */
const ENEMY = unit('enemy-1', 'dark', IN_CATHEDRAL);

/** An intent source the test steers by hand. */
class ScriptedIntent implements IntentSource {
  public isAttacking = false;

  public aim: Vec2 | null = null;

  public read(): InputIntent {
    return { move: { x: 0, y: 0 }, isAttacking: this.isAttacking, aim: this.aim, triggered: [] };
  }
}

/** A fresh following camera on the cathedral, as `Match` builds it. */
const newCamera = (look: Vec2 = IN_CATHEDRAL): Camera =>
  new Camera(look, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);

/**
 * Real camera, roofs, commands and minimap; fake simulation and input. `units` are the snapshot's
 * units; `roofed` the buildings with a roof (none: no click is a roof click).
 */
const setUp = (
  playerId: string | null = ACTOR,
  look: Vec2 = IN_CATHEDRAL,
  {
    units = [],
    roofed = buildings,
  }: { units?: readonly EntitySnapshot[]; roofed?: typeof buildings } = {},
) => {
  const camera = newCamera(look);
  const view = new MatchCamera(camera, MAP);
  view.resize(CANVAS.width, CANVAS.height, 1);
  const roofs = new BuildingRoofs(roofed);
  const input = new ScriptedIntent();
  const enqueueCommand = vi.fn<Simulation['enqueueCommand']>();
  const commands = new PlayerCommands(
    input,
    { enqueueCommand },
    view,
    [HOUSE],
    new AbilityCasts({ enqueueCommand }, vi.fn()),
  );
  // No living Legend here, so the minimap centres on the camera's focus (DEC-182).
  const miniMap = new MiniMapView(MAP, new MapView(MAP), RING, () => look);
  const controls = new MatchViewControls({
    camera: view,
    roofs,
    commands,
    miniMap,
    playerId,
    snapshot: () => ({ entities: units, mapObjects: HOUSE_STATES }),
  });
  const sent = (): Command[] => enqueueCommand.mock.calls.map(([command]) => command);
  return { camera, view, roofs, input, commands, miniMap, controls, sent };
};

describe('MatchViewControls', () => {
  it('lookAtMinimapPoint moves the camera to the clicked world point and stops following', () => {
    const { view, miniMap, controls } = setUp();
    const area = miniMap.areaFor(CANVAS.width, CANVAS.height);
    const click = { x: area.x + area.width / 4, y: area.y + area.height / 2 };
    const target = miniMap.worldPointAt(click.x, click.y, CANVAS.width, CANVAS.height);
    const expected = newCamera();
    expected.lookAt(target as Vec2);

    expect(controls.lookAtMinimapPoint(click.x, click.y)).toBe(true);

    expect(view.visibleArea()).toEqual(expected.visibleArea(MAP.width, MAP.height));
    const jumped = view.visibleArea();
    view.follow({ x: 100, y: 100 });
    expect(view.visibleArea()).toEqual(jumped);
  });

  it('lookAtMinimapPoint reports a click outside the minimap and leaves the view alone', () => {
    const { view, controls } = setUp();
    const before = view.visibleArea();

    expect(controls.lookAtMinimapPoint(0, 0)).toBe(false);

    expect(view.visibleArea()).toEqual(before);
  });

  it('panBy drags the free view against the drag, keeping its size', () => {
    const { view, controls } = setUp();
    const before = view.visibleArea();

    controls.panBy(128, 0);

    const after = view.visibleArea();
    expect(after.x).toBeLessThan(before.x);
    expect(after.width).toBeCloseTo(before.width);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('zoomBy zooms the view in by the factor', () => {
    const { view, controls } = setUp();
    const before = view.visibleArea();

    controls.zoomBy(2);

    expect(view.visibleArea().width).toBeCloseTo(before.width / 2);
  });

  it('clickAt cuts away the roof under the point and puts it back, attacking nothing (DEC-150)', () => {
    const { roofs, controls, sent } = setUp();
    expect(controls.hasDeveloperRoofs).toBe(false);

    expect(controls.clickAt(CENTER.x, CENTER.y)).toBe(true);
    expect([...roofs.hidden]).toEqual(['cathedral-lane-1']);
    expect(controls.hasDeveloperRoofs).toBe(true);

    expect(controls.clickAt(CENTER.x, CENTER.y)).toBe(true);
    expect([...roofs.hidden]).toEqual([]);
    expect(controls.hasDeveloperRoofs).toBe(false);
    // The house under the roof is not attacked: a roof click is no attack.
    expect(sent()).toEqual([]);
  });

  it('clickAt does nothing on open ground and does not move the view', () => {
    const { view, roofs, controls, sent } = setUp(ACTOR, OPEN_GROUND);
    const before = view.visibleArea();

    expect(controls.clickAt(CENTER.x, CENTER.y)).toBe(false);

    expect([...roofs.hidden]).toEqual([]);
    expect(view.visibleArea()).toEqual(before);
    expect(sent()).toEqual([]);
  });

  it('clickAt attacks the enemy unit under the point and leaves its roof closed (DEC-183)', () => {
    const { roofs, controls, sent } = setUp(ACTOR, IN_CATHEDRAL, { units: [PLAYER, ENEMY] });

    expect(controls.clickAt(CENTER.x, CENTER.y)).toBe(false);

    expect(sent()).toEqual([{ type: 'attack-target', actorId: ACTOR, targetId: ENEMY.id }]);
    expect([...roofs.hidden]).toEqual([]);
  });

  it('clickAt with no unit or roof under the point attacks the object there, once', () => {
    const { controls, sent } = setUp(ACTOR, IN_CATHEDRAL, { roofed: [] });

    expect(controls.clickAt(CENTER.x, CENTER.y)).toBe(false);

    expect(sent()).toEqual([{ type: 'attack-target', actorId: ACTOR, targetId: HOUSE_ENTITY }]);
  });

  it('clickAt sends nothing on open ground with no roofs', () => {
    const { controls, sent } = setUp(ACTOR, OPEN_GROUND, { roofed: [] });

    controls.clickAt(CENTER.x, CENTER.y);

    expect(sent()).toEqual([]);
  });

  it('clickAt sends no attack-target command when the player has no Legend', () => {
    const { controls, sent } = setUp(null, IN_CATHEDRAL, { units: [ENEMY], roofed: [] });

    controls.clickAt(CENTER.x, CENTER.y);

    expect(sent()).toEqual([]);
  });

  it('overview shows the whole battlefield and puts back the developer roofs', () => {
    const { view, roofs, controls } = setUp();
    controls.clickAt(CENTER.x, CENTER.y);
    const following = view.visibleArea();

    controls.overview();

    const area = view.visibleArea();
    expect(area.width).toBeGreaterThan(following.width);
    expect(area.width).toBeGreaterThanOrEqual(MAP.width);
    expect(controls.hasDeveloperRoofs).toBe(false);
    expect([...roofs.hidden]).toEqual([]);
  });

  it('leaveExplorer puts back the roofs and returns to the following camera at base zoom', () => {
    const { camera, view, controls } = setUp();
    controls.zoomBy(3);
    controls.clickAt(CENTER.x, CENTER.y);
    controls.overview();
    controls.clickAt(CENTER.x, CENTER.y);
    expect(controls.hasDeveloperRoofs).toBe(true);

    controls.leaveExplorer();

    expect(controls.hasDeveloperRoofs).toBe(false);
    expect(camera.zoom).toBe(BASE_ZOOM);
    expect(view.visibleArea()).toEqual(
      new Camera(IN_CATHEDRAL, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT).visibleArea(
        MAP.width,
        MAP.height,
      ),
    );
  });

  it('setPointerClaimed stops the held attack button from attacking, and gives it back', () => {
    const { input, commands, controls, sent } = setUp();
    input.isAttacking = true;
    input.aim = IN_CATHEDRAL;

    controls.setPointerClaimed(true);
    commands.apply(ACTOR, { entities: [], mapObjects: HOUSE_STATES });
    expect(sent()).toEqual([]);

    controls.setPointerClaimed(false);
    commands.apply(ACTOR, { entities: [], mapObjects: HOUSE_STATES });
    expect(sent()).toEqual([{ type: 'attack-target', actorId: ACTOR, targetId: HOUSE_ENTITY }]);
  });
});
