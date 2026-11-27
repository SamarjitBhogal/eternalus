import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { timelineFrameOf } from '../../config/timelineFrameOf';
import { timelineMarkTick } from '../../config/timelineMarkTick';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../../diagnostics/MemoryLogger';
import { MapGenerator } from '../../map/MapGenerator';
import { MapObjectBuilder } from '../../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../../map/MapPresentationBuilder';
import { Simulation } from '../../Simulation';
import type { DuelOptions } from '../../Simulation.types';
import type { GameState } from '../../state/GameState';

/** A 20 s planned match with no countdown, so mid-game comes after 10 s; a Duel with `duel`. */
const match = (duel?: DuelOptions) => {
  const config = createDefaultGameConfig({
    match: { countdownSeconds: 0, plannedMatchSeconds: 20 },
  });
  const map = new MapGenerator().generate(config, 1);
  const simulation = new Simulation({
    config,
    seed: 1,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    map,
    mapObjects: new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map)),
    ...(duel === undefined ? {} : { duel }),
  });
  const eruption = config.match.timeline.find(({ id }) => id === 'gem-eruption');
  if (eruption === undefined) throw new Error('No gem-eruption entry');
  const eruptionTick = timelineMarkTick(eruption.at, timelineFrameOf(config));
  const gem = simulation.snapshot().entities.find(({ kind }) => kind === 'cathedral-gem');
  if (gem === undefined) throw new Error('No Cathedral gem');
  return { simulation, config, eruptionTick, gem };
};

const stepTo = (simulation: Simulation, tick: number): void => {
  while (simulation.tick < tick) simulation.step();
};

describe('the gem eruption (scenario, 12 §3, DEC-83)', () => {
  it('emits greater-boss-summoned once, on the mid-game tick and not before', () => {
    const { simulation, config, eruptionTick } = match();
    const fired: { tick: number; bossId: string }[] = [];
    simulation.on('greater-boss-summoned', ({ bossId }) => {
      fired.push({ tick: simulation.tick, bossId });
    });

    stepTo(simulation, eruptionTick);
    expect(fired).toEqual([]);

    stepTo(simulation, eruptionTick + 5 * config.tickRate);

    expect(eruptionTick).toBe(0.5 * 20 * config.tickRate);
    expect(fired).toEqual([{ tick: eruptionTick, bossId: 'greater-boss' }]);
    expect(simulation.snapshot().match.phase).toBe('mid-game');
  });

  it('removes the gem and its plinth on its next pass after the eruption, so nothing blocks the centre', () => {
    const { simulation, config, eruptionTick, gem } = match();
    const removed: { tick: number; entityId: string; cause: string }[] = [];
    simulation.on('entity-removed', ({ entityId, cause }) => {
      if (entityId === gem.id) removed.push({ tick: simulation.tick, entityId, cause });
    });
    const { carriedObjectId } = STRUCTURE_DEFINITIONS.get('cathedral');
    const plinthDestroyed = (): boolean | undefined =>
      simulation.snapshot().mapObjects?.find(({ id }) => id === carriedObjectId)?.isDestroyed;
    const at = { x: gem.transform?.x ?? 0, y: gem.transform?.y ?? 0 };
    const isOpenGround = (): boolean | undefined =>
      (simulation as unknown as { readonly state: GameState }).state.world?.grid.isWalkableAt(
        at.x,
        at.y,
      );
    expect(plinthDestroyed()).toBe(false);
    expect(isOpenGround()).toBe(false);

    stepTo(simulation, eruptionTick + 1);
    // A Warrior standing where the gem stood: the debug invariants throw if it overlaps a
    // surviving map object (`no-map-object-overlap`).
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at,
      count: 1,
    });
    stepTo(simulation, eruptionTick + 2 * config.tickRate);

    expect(removed).toEqual([{ tick: eruptionTick + 1, entityId: gem.id, cause: 'despawned' }]);
    expect(simulation.snapshot().entities.some(({ kind }) => kind === 'cathedral-gem')).toBe(false);
    expect(plinthDestroyed()).toBe(true);
    // The path grid reopens with collision (07 §10), so pathing and guards see open ground there.
    expect(isOpenGround()).toBe(true);
  });

  it('summons no boss in a Duel and leaves the gem standing (DEC-36: the world is off)', () => {
    const { simulation, config, eruptionTick, gem } = match({ killTarget: 10 });
    const summoned: string[] = [];
    simulation.on('boss-summoned', ({ entityId }) => summoned.push(entityId));

    stepTo(simulation, eruptionTick + 2 * config.tickRate);

    expect(summoned).toEqual([]);
    expect(simulation.snapshot().entities.some(({ id }) => id === gem.id)).toBe(true);
    expect(
      simulation.snapshot().entities.some(({ definitionId }) => definitionId === 'greater-boss'),
    ).toBe(false);
  });
});
