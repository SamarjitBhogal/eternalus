import {
  type Command,
  type EntityId,
  type EntitySnapshot,
  makeLogRecord,
  type MapDefinition,
  type Snapshot,
  type Vec2,
} from '@eternalus/core';

import { isDead } from '../bridge/selectors/isDead';
import { BuildingRoofs } from './BuildingRoofs';
import { GameLoop } from './engine/loop/GameLoop';
import type { LoopTarget } from './engine/loop/GameLoop.types';
import type { WorldRect } from './engine/render/Renderer.types';
import {
  BACKGROUND_COLOR,
  HUD_MINIMAP_RING,
  MAX_TICKS_PER_FRAME,
  MS_PER_SECOND,
} from './Match.constants';
import type { MatchDeps } from './Match.types';
import { MatchBridge } from './MatchBridge';
import { MatchCamera } from './MatchCamera';
import { PlayerCommands } from './PlayerCommands';
import { createDefaultViewRegistry } from './views/defaultViewRegistry';
import { EntityLayer } from './views/EntityLayer';
import { MapView } from './views/MapView';
import { MiniMapView } from './views/MiniMapView';
import { SceneryView } from './views/SceneryView';
import { SceneView } from './views/SceneView';
import { WorldObjectsView } from './views/WorldObjectsView';

/**
 * The composition root of one match (architecture 08 §7): it wires the simulation, the game
 * loop, the renderer, the camera, the player's intent and the views, and owns their lifetime.
 * Each tick turns the player's intent into commands (`PlayerCommands`), steps the simulation and
 * keeps the last two snapshots; each frame follows the player with the camera and draws the scene
 * and the minimap (inside the HUD ring). The player's Legend is spawned at its team's stronghold
 * when the match is created. Which part of the world is shown (the following camera, or the free
 * view that dragging and the overview switch to) is `MatchCamera`'s. Buildings stay in the same
 * world scene: `BuildingRoofs` cuts away the roof of the building the player's Legend stands in
 * (DEC-143) and those the developer explorer opens, and the views draw those interiors in place.
 * The minimap is player HUD, drawn every frame whatever the developer flag (DEC-143). The world
 * (map, presentation, map objects) arrives prepared (06 §1); its `MatchBridge` publishes to the UI.
 */
export class Match implements LoopTarget {
  private readonly loop: GameLoop;

  private readonly entities: EntityLayer;

  /** The map objects (walls, furniture, doors) and their destroyed state, drawn in the scene. */
  private readonly objects: WorldObjectsView;

  private readonly world: { readonly scene: SceneView; readonly miniMap: MiniMapView };

  private readonly camera: MatchCamera;

  private readonly roofs: BuildingRoofs;

  private readonly commands: PlayerCommands;

  private readonly stopListening: () => void;

  private readonly bridge: MatchBridge;

  private previous: Snapshot | null = null;

  private current: Snapshot;

  private playerId: EntityId | null = null;

  /**
   * Creates the match, queues the player's spawn (`spawnPlayer`) and points the camera at the
   * spawn point.
   *
   * @throws Error when the map has no stronghold for the player's team.
   */
  public constructor(private readonly deps: MatchDeps) {
    const { simulation, world, tickRate, scheduler, camera, player, logger, bridge, input } = deps;
    const { map, presentation, mapObjects } = world;
    // Find the spawn point first: if the map has none, nothing has been subscribed yet.
    const spawnPoint = Match.strongholdOf(map, player.team);
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
    );
    this.camera = new MatchCamera(camera, map);
    this.commands = new PlayerCommands(input, simulation, this.camera, mapObjects);
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
    this.world = { scene, miniMap: new MiniMapView(map, scene, HUD_MINIMAP_RING) };
    const tickMs = MS_PER_SECOND / tickRate;
    this.loop = new GameLoop(scheduler, this, {
      tickMs,
      maxFrameMs: MAX_TICKS_PER_FRAME * tickMs,
    });
    this.bridge = new MatchBridge({ ...bridge, tickRate, map });
    this.stopListening = this.spawnPlayer(spawnPoint);
    this.current = simulation.snapshot();
    camera.lookAt(spawnPoint);
  }

  /** The id of the player's Legend, once it has spawned (after the first tick). */
  public get playerEntityId(): EntityId | null {
    return this.playerId;
  }

  /**
   * Whether the developer explorer opened any roof (the toolbar then offers to restore them); the
   * roof of the player's building does not count.
   */
  public get hasDeveloperRoofs(): boolean {
    return this.roofs.hasOpened;
  }

  /** The latest snapshot. */
  public get snapshot(): Snapshot {
    return this.current;
  }

  /** Publishes everything the HUD shows once, then starts the game loop. */
  public start(): void {
    this.bridge.publishAll(this.current, this.playerId);
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
      const isMoving = this.commands.apply(
        this.playerId,
        this.current.mapObjects ?? [],
        this.current.entities,
      );
      if (isMoving) {
        this.camera.playerMoved();
      }
    }
    this.deps.simulation.step();
    this.previous = this.current;
    this.current = this.deps.simulation.snapshot();
    const player = this.playerEntity();
    this.roofs.playerAt(isDead(player?.health ?? null) ? null : (player?.transform ?? null));
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
    miniMap.draw(renderer, this.camera.screenWidth, this.camera.screenHeight, view);
  }

  /**
   * The game loop stopped because a tick or a frame threw: hands the error and the tick to the
   * match's owner (`onCrash`), which ends the match (DEC-106).
   */
  public crashed(error: unknown): void {
    this.deps.onCrash({ error, tick: this.deps.simulation.tick });
  }

  /**
   * Moves the camera to the world point under a minimap click and stops following the player
   * until the player moves again.
   *
   * @returns Whether the click was on the minimap.
   */
  public lookAtMinimapPoint(screenX: number, screenY: number): boolean {
    const { screenWidth, screenHeight } = this.camera;
    const target = this.world.miniMap.worldPointAt(screenX, screenY, screenWidth, screenHeight);
    if (target === null) {
      return false;
    }
    this.camera.lookAt(target);
    return true;
  }

  /** Drags the view by a screen offset (device pixels), switching to the free view. */
  public panBy(screenDx: number, screenDy: number): void {
    this.camera.panBy(screenDx, screenDy);
  }

  /** Zooms whichever view is on screen; `factor` above 1 zooms in. */
  public zoomBy(factor: number): void {
    this.camera.zoomBy(factor);
  }

  /**
   * The developer explorer's click: cuts away the roof of the building under the screen point
   * (device pixels), or puts back one it cut away. The view does not move.
   * @returns Whether a roof was toggled: not on open ground or the player's building (DEC-150).
   */
  public toggleRoofAt(screenX: number, screenY: number): boolean {
    return this.roofs.toggleAt(this.camera.worldAt(screenX, screenY));
  }

  /**
   * The explorer's plain click that is no roof click (DEC-150): the player's Legend attacks the
   * living enemy unit, else map object, under the screen point (device pixels), once; no Legend,
   * no attack.
   */
  public attackAt(screenX: number, screenY: number): void {
    if (this.playerId === null) return;
    const point = this.camera.worldAt(screenX, screenY);
    this.commands.attackAt(
      this.playerId,
      point,
      this.current.mapObjects ?? [],
      this.current.entities,
    );
  }

  /**
   * Shows the whole battlefield in the free view and puts back every roof the developer cut away
   * (the player's building stays open).
   */
  public overview(): void {
    this.camera.overview();
    this.roofs.restore();
  }

  /**
   * The developer explorer was hidden: puts back the roofs the developer cut away (the player's
   * building stays open) and returns to the following camera at its base zoom, so developer state
   * does not stay in normal play (DEC-143).
   */
  public leaveExplorer(): void {
    this.roofs.restore();
    this.camera.leaveExplorer();
  }

  /**
   * Whether the canvas gestures own the main button's press (a minimap click, or any press with the
   * developer explorer shown): the held button is then no attack, and a plain click with the
   * explorer attacks on its release instead (`attackAt`, DEC-150; 06 §10, input arbitration).
   */
  public setPointerClaimed(isClaimed: boolean): void {
    this.commands.setPointerClaimed(isClaimed);
  }

  /**
   * Stops the loop and the event subscription. The renderer and camera are injected, so their
   * owner (`MatchHost`) destroys them.
   */
  public destroy(): void {
    this.loop.destroy();
    this.stopListening();
  }

  /**
   * Queues the player's spawn at `at` and watches for it: the spawned Legend becomes
   * `playerEntityId`; a rejected spawn logs ERROR `client.match` naming the class id and the
   * reason (the match then runs with no player Legend). Returns the unsubscribe.
   */
  private spawnPlayer(at: Vec2): () => void {
    const { simulation, player, logger } = this.deps;
    const spawn: Command<'dev-spawn'> = {
      type: 'dev-spawn',
      kind: player.legend,
      definitionId: player.legend,
      team: player.team,
      at,
      count: 1,
    };
    const stopSpawned = simulation.on('entity-spawned', ({ entityId, kind, team }) => {
      if (this.playerId === null && kind === player.legend && team === player.team) {
        this.playerId = entityId;
      }
    });
    const stopRejected = simulation.on('command-rejected', ({ command, reason }) => {
      if (command !== spawn) return;
      logger.log(
        makeLogRecord(
          'ERROR',
          'client.match',
          `The player's Legend "${player.legend}" did not spawn: ${reason}.`,
          { attributes: { classId: player.legend, reason } },
        ),
      );
    });
    simulation.enqueueCommand(spawn);
    return () => {
      stopSpawned();
      stopRejected();
    };
  }

  /** The player's Legend in the latest snapshot; `undefined` before it spawns or once removed. */
  private playerEntity(): EntitySnapshot | undefined {
    return this.current.entities.find((entity) => entity.id === this.playerId);
  }

  private static strongholdOf(map: MapDefinition, team: MatchDeps['player']['team']): Vec2 {
    const stronghold = map.features.find(
      (feature) => feature.kind === 'stronghold' && feature.team === team,
    );
    if (stronghold === undefined) {
      throw new Error(`Map "${map.id}" has no ${team} stronghold to spawn the player at.`);
    }
    return stronghold.position;
  }
}
