import type { AbilitySlot } from '../../commands/Command.types';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import type { MapObject } from '../../content/maps/mapObjects.types';
import type { MapDefinition } from '../../content/maps/maps.types';
import { NullLogger } from '../../diagnostics/NullLogger';
import type { DefinitionSource } from '../../entities/EntityFactory.types';
import { Simulation } from '../../Simulation';
import type { EntityId } from '../../state/EntityStore.types';
import type { Team } from '../../teams/teams.types';
import type { Vec2 } from '../../utils/geometry.types';
import { stepPastCountdown } from './stepPastCountdown';

/** One entity to place before the first tick: a dev-spawn of `kind` (and definition `kind` by default). */
export type ScenarioSpawn = {
  readonly kind: string;
  readonly definitionId?: string;
  readonly team: Team;
  readonly at: Vec2;
};

/**
 * A real `Simulation` with the shipped content and abilities, on `world`'s map and map objects or
 * on no map (no walls, no lanes), the given entities spawned in the first tick (`ids`, in the same
 * order) and the countdown stepped
 * past (DEC-88 holds every unit idle until it ends), and a log of what the cast path and the
 * statuses announced. Each log line starts with its tick counted from the end of the countdown:
 * the first step after it is tick 1.
 */
export const abilityMatch = (
  spawns: readonly ScenarioSpawn[],
  {
    seed = 1,
    content,
    world,
  }: {
    readonly seed?: number;
    readonly content?: DefinitionSource;
    readonly world?: { readonly map: MapDefinition; readonly mapObjects: readonly MapObject[] };
  } = {},
) => {
  const sim = new Simulation({
    config: createDefaultGameConfig(),
    seed,
    logger: new NullLogger(),
    ...(content === undefined ? {} : { content }),
    ...world,
  });
  const ids: EntityId[] = [];
  const log: string[] = [];
  let origin = 0;
  const now = (): string => String(sim.tick - origin);
  sim.on('entity-spawned', ({ entityId }) => ids.push(entityId));
  sim.on('ability-cast', ({ casterId, abilityId }) => {
    log.push(`${now()} cast ${casterId} ${abilityId}`);
  });
  sim.on('command-rejected', ({ command, reason }) => {
    const actor = 'actorId' in command ? String(command.actorId) : command.type;
    log.push(`${now()} rejected ${actor} ${reason}`);
  });
  sim.on('status-applied', ({ entityId, statusId }) => {
    log.push(`${now()} ${statusId} on ${entityId}`);
  });
  sim.on('status-expired', ({ entityId, statusId }) => {
    log.push(`${now()} ${statusId} off ${entityId}`);
  });
  for (const { kind, definitionId = kind, team, at } of spawns) {
    sim.enqueueCommand({ type: 'dev-spawn', kind, definitionId, team, at, count: 1 });
  }
  stepPastCountdown(sim);
  origin = sim.tick - 1;
  log.length = 0;

  /** Queues a cast of `slot` by `actorId` aimed at `point`, applied in the next step. */
  const cast = (actorId: EntityId, slot: AbilitySlot, point: Vec2): void => {
    sim.enqueueCommand({ type: 'cast-ability', actorId, slot, aim: { point, targetId: null } });
  };
  /** Advances `ticks` steps. */
  const run = (ticks: number): void => {
    for (let tick = 0; tick < ticks; tick += 1) sim.step();
  };
  /** The entity's snapshot now, or `undefined` once it is gone. */
  const entity = (id: EntityId | undefined) => sim.snapshot().entities.find((e) => e.id === id);
  /** Where the entity stands now. */
  const at = (id: EntityId | undefined): Vec2 => {
    const transform = entity(id)?.transform;
    return { x: transform?.x ?? Number.NaN, y: transform?.y ?? Number.NaN };
  };
  /** How much health the entity has lost. */
  const lost = (id: EntityId | undefined): number => {
    const health = entity(id)?.health;
    return health === null || health === undefined ? Number.NaN : health.max - health.current;
  };
  return { sim, ids, log, cast, run, entity, at, lost };
};
