import { type EntityId, type EntitySnapshot, makeLogRecord, type Snapshot } from '@eternalus/core';

import { isDead } from '../bridge/selectors/isDead';
import { BuildingRoofs } from './BuildingRoofs';
import { GameLoop } from './engine/loop/GameLoop';
import { DeveloperMenuController } from './DeveloperMenuController';
import { HealthBarVisibility } from './HealthBarVisibility';
import type { LoopTarget } from './engine/loop/GameLoop.types';
import type { WorldPoint, WorldRect } from './engine/render/Renderer.types';
import {
  BACKGROUND_COLOR,
  HUD_MINIMAP_RING,
  MAX_TICKS_PER_FRAME,
  MS_PER_SECOND,
} from './Match.constants';
import type { MatchDeps } from './Match.types';
import { MatchBridge } from './MatchBridge';
import { MatchCamera } from './MatchCamera';
import { MatchViewControls } from './MatchViewControls';
import type { PlayerActions } from './PlayerActions';
import { PlayerCommands } from './PlayerCommands';
import { createDefaultViewRegistry } from './views/defaultViewRegistry';
import { EntityLayer } from './views/EntityLayer';
import { MapView } from './views/MapView';
import { MiniMapView } from './views/MiniMapView';
import { SceneryView } from './views/SceneryView';
import { SceneView } from './views/SceneView';
import { WorldObjectsView } from './views/WorldObjectsView';

/**
 * The composition root of one match (architecture 08 §7): it wires the simulation, the game loop,
 * the renderer, the camera, the player's intent and the views, and owns their lifetime. Each tick
 * turns the player's intent into commands (`PlayerCommands`), steps the simulation and keeps the
 * last two snapshots; each frame follows the player with the camera and draws the scene and the
 * minimap (inside the HUD ring). The player's Legend is the simulation's, spawned at its team's
 * Stronghold by core from the roster's human slot. In an online Duel (`deps.remote`) the simulation
 * is the server's latest snapshot and the tick sends the intent instead of queueing commands; the
 * Legend is the one the server named (ADR 0016). Which part of the world is shown (the following
 * camera, or the free view that dragging and the overview switch to) is `MatchCamera`'s. Buildings
 * stay in the same world scene: `BuildingRoofs` cuts away the roof of the building the player's
 * Legend stands in (DEC-143) and those the developer explorer opens, and the views draw those
 * interiors in place. The minimap is player HUD, drawn every frame whatever the developer flag
 * (DEC-143). The world (map, presentation, map objects) arrives prepared (06 §1); its `MatchBridge`
 * publishes to the UI. The canvas gestures act through its `controls` (`MatchViewControls`).
 */
export class Match implements LoopTarget {
  private readonly loop: GameLoop;

  private readonly entities: EntityLayer;

  /** Which units draw a world health bar, and on which side; it listens to the simulation's events. */
  private readonly healthBars: HealthBarVisibility;

  /** The map objects (walls, furniture, doors) and their destroyed state, drawn in the scene. */
  private readonly objects: WorldObjectsView;

  private readonly world: { readonly scene: SceneView; readonly miniMap: MiniMapView };

  private readonly camera: MatchCamera;

  private readonly roofs: BuildingRoofs;

  private readonly commands: PlayerActions;

  private readonly bridge: MatchBridge;

  private previous: Snapshot | null = null;

  private current: Snapshot;

  private readonly playerId: EntityId | null;

  /** The developer menu's key, state and `dev-command` path (13 §4); inert unless enabled. */
  public readonly developerMenu: DeveloperMenuController;

  /** What the canvas gestures do to this match: camera, minimap, roofs, explorer attack. */
  public readonly controls: MatchViewControls;

  /**
   * Creates the match, takes the player's Legend from the simulation's snapshot (core spawned it
   * from the roster's human slot) and points the camera at it; with no Legend (the human slot
   * named no Legend definition), at the middle of the map.
   */
  public constructor(private readonly deps: MatchDeps) {
    const { simulation, world, tickRate, scheduler, camera, logger, bridge, input } = deps;
    const { map, presentation, mapObjects } = world;
    this.healthBars = new HealthBarVisibility(simulation);
    this.entities = new EntityLayer(
      createDefaultViewRegistry((kind) => {
        logger.log(
          makeLogRecord(
            'WARN',
            'client.views',
            `No view for kind "${kind}"; drawing the default view.`,
          ),
        );
      }),
      isDead,
      this.healthBars.healthBarOf,
    );
    this.camera = new MatchCamera(camera, map);
    this.commands =
      deps.remote?.createActions(this.camera) ??
      new PlayerCommands(input, simulation, this.camera, mapObjects);
    const { scenery, buildings } = presentation;
    this.roofs = new BuildingRoofs(buildings);
    const { hidden: hiddenRoofs } = this.roofs;
    const shown = (): WorldRect => this.camera.visibleArea();
    this.objects = new WorldObjectsView(mapObjects, hiddenRoofs, shown);
    const { isDestroyed } = this.objects;
    const scene = new SceneView([
      new MapView(map, scenery, hiddenRoofs, shown, buildings, isDestroyed),
      new SceneryView(scenery, 'detail', hiddenRoofs, shown, isDestroyed),
      this.objects,
      this.entities,
    ]);
    const centre = (): WorldPoint => this.miniMapCentre();
    this.world = { scene, miniMap: new MiniMapView(map, scene, HUD_MINIMAP_RING, centre) };
    const tickMs = MS_PER_SECOND / tickRate;
    this.loop = new GameLoop(scheduler, this, {
      tickMs,
      maxFrameMs: MAX_TICKS_PER_FRAME * tickMs,
    });
    this.bridge = new MatchBridge({ ...bridge, tickRate, map });
    this.developerMenu = new DeveloperMenuController({
      isEnabled: deps.isDeveloperMenuEnabled === true,
      simulation,
      bus: bridge.bus,
      map,
    });
    this.current = simulation.snapshot();
    this.playerId = deps.remote?.legendId ?? this.current.match.humanLegendId;
    this.healthBars.observe(this.current, this.playerId);
    this.controls = new MatchViewControls({
      camera: this.camera,
      roofs: this.roofs,
      commands: this.commands,
      miniMap: this.world.miniMap,
      onMiniMapShownChanged: (isShown) => {
        bridge.bus.emit('minimap-visibility', { isShown });
        // The loop is stopped while paused, so nothing else would repaint the canvas.
        if (!this.loop.isRunning) {
          this.render(1);
        }
      },
      playerId: this.playerId,
      snapshot: () => this.current,
    });
    camera.lookAt(this.playerEntity()?.transform ?? { x: map.width / 2, y: map.height / 2 });
  }

  /** The id of the player's Legend; known from construction, `null` when its spawn failed. */
  public get playerEntityId(): EntityId | null {
    return this.playerId;
  }

  /** The latest snapshot. */
  public get snapshot(): Snapshot {
    return this.current;
  }

  /**
   * Publishes everything the HUD shows once (the minimap's visibility too: a new match starts with
   * it shown, whatever the last one left in the store), then starts the game loop.
   */
  public start(): void {
    this.bridge.publishAll(this.current, this.playerId);
    this.developerMenu.publish();
    this.deps.bridge.bus.emit('minimap-visibility', { isShown: this.world.miniMap.isVisible });
    this.loop.start();
  }

  /**
   * Stops the loop (pause) or starts it again; the loop keeps its remainder and restarts its frame
   * clock, so paused time is not simulated (13 §7: the match pauses from `pause-menu`; ES-11).
   */
  public setPaused(isPaused: boolean): void {
    if (isPaused) {
      this.loop.stop();
    } else {
      this.loop.start();
    }
  }

  /** Sets the drawing area in device pixels; call on mount and on every resize. */
  public resize(screenWidth: number, screenHeight: number, pixelRatio: number): void {
    this.camera.resize(screenWidth, screenHeight, pixelRatio);
    this.deps.renderer.resize(screenWidth, screenHeight, pixelRatio);
  }

  /**
   * One tick: the player's intent becomes commands (and moving input sends the camera back to
   * following), the simulation steps, and the roof of the building the player's Legend now stands
   * in opens. A dead Legend (`isDead`, or gone from the snapshot) stands in no building, so its
   * roof closes (DEC-143, DEC-149).
   */
  public tick(): void {
    if (this.playerId !== null) {
      const isMoving = this.commands.apply(this.playerId, this.current);
      if (isMoving) {
        this.camera.playerMoved();
      }
    }
    this.deps.simulation.step();
    this.previous = this.current;
    this.current = this.deps.simulation.snapshot();
    this.healthBars.observe(this.current, this.playerId);
    this.roofs.playerAt(this.livingPlayerAt());
    this.bridge.afterTick(this.current, this.playerId);
  }

  /** One frame: the camera follows the player, then the scene and the minimap are drawn. */
  public render(alpha: number): void {
    const { renderer } = this.deps;
    this.camera.follow(this.playerEntity()?.transform ?? null);
    const view = this.camera.visibleArea();
    const { scene, miniMap } = this.world;
    renderer.clear(BACKGROUND_COLOR);
    renderer.showWorldArea(view);
    this.entities.show(this.previous, this.current, alpha, this.playerId);
    this.objects.show(this.current.mapObjects ?? []);
    scene.draw(renderer);
    miniMap.draw(renderer, this.camera.screenWidth, this.camera.screenHeight);
  }

  /**
   * The game loop stopped because a tick or a frame threw: hands the error and the tick to the
   * match's owner (`onCrash`), which ends the match (DEC-106).
   */
  public crashed(error: unknown): void {
    this.deps.onCrash({ error, tick: this.deps.simulation.tick });
  }

  /**
   * Stops the loop and the health bars' event listeners. The renderer and camera are injected, so
   * their owner (`MatchHost`) destroys them.
   */
  public destroy(): void {
    this.loop.destroy();
    this.healthBars.destroy();
    this.developerMenu.destroy();
  }

  /**
   * Where the player's Legend stands while it lives (the open roof and the minimap's centre);
   * `null` before it spawns, once dead or gone. The minimap then centres on the camera (DEC-182).
   */
  private livingPlayerAt(): WorldPoint | null {
    const player = this.playerEntity();
    return isDead(player?.health ?? null) ? null : (player?.transform ?? null);
  }

  /** The minimap's centre: the living player's Legend, else the camera's centre (DEC-182). */
  private miniMapCentre(): WorldPoint {
    const view = this.camera.visibleArea();
    return this.livingPlayerAt() ?? { x: view.x + view.width / 2, y: view.y + view.height / 2 };
  }

  /** The player's Legend in the latest snapshot; `undefined` before it spawns or once removed. */
  private playerEntity(): EntitySnapshot | undefined {
    return this.current.entities.find((entity) => entity.id === this.playerId);
  }
}
