import {
  CORNER_CAMP_RING,
  type EntityId,
  type EntitySnapshot,
  makeLogRecord,
  type Snapshot,
} from '@eternalus/core';

import { isDead } from '../bridge/selectors/isDead';
import { BuildingRoofs } from './BuildingRoofs';
import { CathedralCutscene } from './CathedralCutscene';
import { CUTSCENE } from './CathedralCutscene.constants';
import { BiomeAtmosphereView } from './views/BiomeAtmosphereView';
import { DamageBadges } from './DamageBadges';
import { DamageBadgeLayer } from './views/DamageBadgeLayer';
import { GameLoop } from './engine/loop/GameLoop';
import { DeveloperMenuController } from './DeveloperMenuController';
import { HealthBarVisibility } from './HealthBarVisibility';
import { LegendBodies } from './LegendBodies';
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
import { LegendSprites } from './LegendSprites';
import { createDefaultViewRegistry } from './views/defaultViewRegistry';
import { EntityLayer } from './views/EntityLayer';
import { EruptionView } from './views/EruptionView';
import { LegendBodyLayer } from './views/LegendBodyLayer';
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

  private readonly bodies: LegendBodies;

  /** Which damage numbers are on screen (W5, DEC-410); it listens to the simulation's events. */
  private readonly damageBadges: DamageBadges;

  private readonly badgeLayer: DamageBadgeLayer;

  /** The map objects (walls, furniture, doors) and their destroyed state, drawn in the scene. */
  private readonly objects: WorldObjectsView;
  private readonly atmosphere: BiomeAtmosphereView;

  private readonly world: { readonly scene: SceneView; readonly miniMap: MiniMapView };

  private readonly camera: MatchCamera;

  /** The mid-game cut-scene: where the camera looks around the gem eruption, and its burst. */
  private readonly cutscene: CathedralCutscene;

  private readonly roofs: BuildingRoofs;

  private readonly commands: PlayerActions;

  private readonly bridge: MatchBridge;

  private previous: Snapshot | null = null;

  private current: Snapshot;

  /** Every Legend's sprite: the animations and the Legend view (DEC-378). */
  private readonly legendSprites: LegendSprites;

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
    this.current = simulation.snapshot();
    this.legendSprites = new LegendSprites(deps);
    this.healthBars = new HealthBarVisibility(simulation);
    this.bodies = new LegendBodies(simulation);
    this.damageBadges = new DamageBadges(
      simulation,
      () => deps.settings?.()?.hud.shouldShowEveryHit ?? false,
      tickRate,
    );
    this.badgeLayer = new DamageBadgeLayer(
      () => this.damageBadges.badges,
      () => deps.isReducedMotion?.() ?? false,
      tickRate,
    );
    const views = createDefaultViewRegistry((kind) => {
      logger.log(
        makeLogRecord(
          'WARN',
          'client.views',
          `No view for kind "${kind}"; drawing the default view.`,
        ),
      );
    }, this.legendSprites.view);
    this.entities = new EntityLayer(views, isDead, this.healthBars.healthBarOf);
    this.camera = new MatchCamera(camera, map);
    this.cutscene = new CathedralCutscene(simulation, tickRate);
    this.commands =
      deps.remote?.createActions(this.camera) ??
      new PlayerCommands(input, simulation, this.camera, mapObjects, views);
    const { scenery, buildings } = presentation;
    this.roofs = new BuildingRoofs(buildings);
    const { hidden: hiddenRoofs } = this.roofs;
    const shown = (): WorldRect => this.camera.visibleArea();
    this.objects = new WorldObjectsView(mapObjects, hiddenRoofs, shown);
    const { isDestroyed } = this.objects;
    this.atmosphere = new BiomeAtmosphereView(scenery, shown);
    const featureSizes = { 'corner-camp': 2 * CORNER_CAMP_RING.radius } as const;
    const scene = new SceneView([
      new MapView(map, scenery, hiddenRoofs, shown, buildings, isDestroyed, featureSizes),
      new SceneryView(scenery, 'detail', hiddenRoofs, shown, isDestroyed),
      this.objects,
      new LegendBodyLayer(this.bodies.bodies),
      this.entities,
      this.atmosphere,
      new EruptionView(() => this.cutscene.burst()),
      this.badgeLayer,
    ]);
    const centre = (): WorldPoint => this.miniMapCentre();
    this.world = { scene, miniMap: new MiniMapView(map, scene, HUD_MINIMAP_RING, centre) };
    const tickMs = MS_PER_SECOND / tickRate;
    this.loop = new GameLoop(scheduler, this, {
      tickMs,
      maxFrameMs: MAX_TICKS_PER_FRAME * tickMs,
    });
    this.developerMenu = new DeveloperMenuController({
      isEnabled: deps.isDeveloperMenuEnabled === true,
      simulation,
      bus: bridge.bus,
      map,
      humanLegendId: () => this.playerId,
      onFollow: () => {
        this.camera.playerMoved();
      },
    });
    this.healthBars.observe(this.current, this.playerId);
    this.damageBadges.observe(this.current, this.playerId);
    this.bodies.observe(this.current);
    this.bridge = new MatchBridge({
      ...bridge,
      tickRate,
      map,
      events: simulation,
      firstSnapshot: this.current,
    });
    this.controls = this.createControls();
    camera.lookAt(this.playerEntity()?.transform ?? { x: map.width / 2, y: map.height / 2 });
  }

  private createControls(): MatchViewControls {
    return new MatchViewControls({
      camera: this.camera,
      roofs: this.roofs,
      commands: this.commands,
      playerId: () => this.playerId,
      miniMap: this.world.miniMap,
      onMiniMapShownChanged: (isShown) => {
        this.deps.bridge.bus.emit('minimap-visibility', { isShown });
        // The loop is stopped while paused, so nothing else would repaint the canvas.
        if (!this.loop.isRunning) {
          this.render(1);
        }
      },
      snapshot: () => this.current,
    });
  }

  /**
   * The id of the player's Legend: `null` when its spawn failed or, in sim mode, while the match
   * has no human (`dev-set-controller` moves it, 13 §4); follows the latest snapshot.
   */
  public get playerEntityId(): EntityId | null {
    return this.playerId;
  }

  private get playerId(): EntityId | null {
    return this.deps.remote?.legendId ?? this.current.match.humanLegendId;
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
   * roof closes (DEC-143, DEC-149). After the tick that ended the match, tells the observer once
   * (`ended`).
   */
  public tick(): void {
    let isMoving = false;
    if (this.playerId !== null) {
      isMoving = this.commands.apply(this.playerId, this.current);
      if (isMoving) {
        this.camera.playerMoved();
      }
    }
    this.deps.simulation.step();
    this.previous = this.current;
    const previousPlayerId = this.playerId;
    this.current = this.deps.simulation.snapshot();
    if (this.playerId !== previousPlayerId) {
      this.developerMenu.publish();
    }
    this.developerMenu.observeLegends(this.current.entities);
    this.legendSprites.observe(this.current);
    this.healthBars.observe(this.current, this.playerId);
    this.damageBadges.observe(this.current, this.playerId);
    this.bodies.observe(this.current);
    this.cutscene.observe(this.current, isMoving, this.livingPlayerAt());
    this.roofs.playerAt(this.livingPlayerAt());
    if (this.bridge.afterTick(this.current, this.playerId)) {
      this.deps.observer.ended();
    }
  }

  /**
   * One frame: the camera follows the player (with no human, the Legend the developer menu's
   * Follow names) or looks where the mid-game cut-scene says, then the scene and the minimap are
   * drawn.
   */
  public render(alpha: number): void {
    const { renderer } = this.deps;
    const focus = this.cutscene.focus();
    if (focus === null) {
      this.camera.follow(this.cameraTarget()?.transform ?? null);
    } else {
      this.camera.focusOn(focus, CUTSCENE.smoothing);
    }
    const view = this.camera.visibleArea();
    const { scene, miniMap } = this.world;
    renderer.clear(BACKGROUND_COLOR);
    renderer.showWorldArea(view);
    this.entities.show(this.previous, this.current, alpha, this.playerId);
    this.badgeLayer.show(this.previous, this.current, alpha);
    this.objects.show(this.current.mapObjects ?? []);
    this.atmosphere.show(
      this.livingPlayerAt(),
      (this.current.tick + alpha) / this.deps.tickRate,
      this.camera.isPlayerFollowing,
    );
    scene.draw(renderer);
    miniMap.draw(renderer, this.camera.screenWidth, this.camera.screenHeight);
  }

  /**
   * The game loop stopped because a tick or a frame threw: hands the error and the tick to the
   * observer (`crashed`), whose owner ends the match (DEC-106).
   */
  public crashed(error: unknown): void {
    this.deps.observer.crashed({ error, tick: this.deps.simulation.tick });
  }

  /**
   * Stops the loop, the health bars' event listeners and the bridge's listener. The renderer and
   * camera are injected, so their owner (`MatchHost`) destroys them.
   */
  public destroy(): void {
    this.legendSprites.destroy();
    this.loop.destroy();
    this.healthBars.destroy();
    this.cutscene.destroy();
    this.bodies.destroy();
    this.damageBadges.destroy();
    this.developerMenu.destroy();
    this.bridge.destroy();
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

  /**
   * What the camera follows: the player's Legend, or with no human the Legend the developer menu
   * follows (13 §4 spectate); `undefined` when neither is in the latest snapshot.
   */
  private cameraTarget(): EntitySnapshot | undefined {
    const followed = this.developerMenu.followedLegendId;
    return (
      this.playerEntity() ??
      this.current.entities.find(({ id, family }) => id === followed && family === 'legend')
    );
  }

  /** The player's Legend in the latest snapshot; `undefined` before it spawns or once removed. */
  private playerEntity(): EntitySnapshot | undefined {
    return this.current.entities.find((entity) => entity.id === this.playerId);
  }
}
