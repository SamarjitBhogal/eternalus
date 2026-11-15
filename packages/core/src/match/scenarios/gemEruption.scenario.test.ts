import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { timelineMarkTick } from '../../config/timelineMarkTick';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../../diagnostics/MemoryLogger';
import { MapGenerator } from '../../map/MapGenerator';
import { MapObjectBuilder } from '../../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../../map/MapPresentationBuilder';
import { Simulation } from '../../Simulation';

/** A 20 s planned match with no countdown, so mid-game comes after 10 s. */
const match = () => {
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
  });
  const eruption = config.match.timeline.find(({ id }) => id === 'gem-eruption');
  if (eruption === undefined) throw new Error('No gem-eruption entry');
  const eruptionTick = timelineMarkTick(
    eruption.at,
    config.tickRate,
    config.match.plannedMatchSeconds,
  );
  const feature = map.features.find(({ definitionId }) => definitionId === 'cathedral');
  if (feature === undefined) throw new Error('No Cathedral');
  return { simulation, config, eruptionTick, feature };
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

    stepTo(simulation, eruptionTick - 1);
    expect(fired).toEqual([]);
    expect(simulation.snapshot().match.isGemErupted).toBe(false);

    stepTo(simulation, eruptionTick + 5 * config.tickRate);

    expect(eruptionTick).toBe(0.5 * 20 * config.tickRate);
    expect(fired).toEqual([{ tick: eruptionTick, bossId: 'greater-boss' }]);
    expect(simulation.snapshot().match).toMatchObject({ phase: 'mid-game', isGemErupted: true });
  });

  it('strikes an attacker before the eruption and never after, while it still hits the gem', () => {
    const { simulation, config, eruptionTick, feature } = match();
    stepTo(simulation, eruptionTick - 3 * config.tickRate);
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: { x: feature.position.x - 6, y: feature.position.y },
      count: 1,
    });
    simulation.step();
    const warrior = simulation.snapshot().entities.find(({ kind }) => kind === 'warrior');
    const cathedral = simulation.snapshot().entities.find(({ kind }) => kind === 'cathedral');
    if (warrior === undefined || cathedral === undefined) throw new Error('No warrior or gem');
    const struck: number[] = [];
    const blocked: number[] = [];
    simulation.on('structure-struck', () => struck.push(simulation.tick));
    simulation.on('damage-blocked', ({ targetId }) => {
      if (targetId === cathedral.id) blocked.push(simulation.tick);
    });
    simulation.enqueueCommand({
      type: 'attack-target',
      actorId: warrior.id,
      targetId: cathedral.id,
    });

    stepTo(simulation, eruptionTick + 4 * config.tickRate);

    expect(struck.filter((tick) => tick < eruptionTick).length).toBeGreaterThan(0);
    expect(struck.filter((tick) => tick >= eruptionTick)).toEqual([]);
    expect(blocked.filter((tick) => tick >= eruptionTick).length).toBeGreaterThan(1);
  });
});
