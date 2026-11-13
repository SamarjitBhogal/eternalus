import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

const roster: readonly RosterSlot[] = [
  { pilot: 'human', team: 'dark', definitionId: 'warrior', role: 'rover' },
  { pilot: 'bot', team: 'dark', definitionId: 'warrior', role: 'laner', difficulty: 'normal' },
  { pilot: 'bot', team: 'light', definitionId: 'warrior', role: 'rover', difficulty: 'normal' },
  { pilot: 'bot', team: 'light', definitionId: 'warrior', role: 'laner', difficulty: 'normal' },
];

/** `throwOnViolation` makes any invariant violation fail the test. */
const newMatch = (): { simulation: Simulation; logger: MemoryLogger } => {
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config: createDefaultGameConfig({ match: { playerTeam: 'dark', countdownSeconds: 0 } }),
    seed: 3,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map: TWO_LANE_MAP,
    roster,
  });
  return { simulation, logger };
};

const run = (simulation: Simulation, ticks: number): void => {
  for (let tick = 0; tick < ticks; tick += 1) {
    simulation.step();
  }
};

const humanOf = (simulation: Simulation): string | null =>
  simulation.snapshot().match.humanLegendId;

const positionOf = (simulation: Simulation, id: string) =>
  simulation.snapshot().entities.find((entity) => entity.id === id)?.transform;

/** The dark laner: a bot Legend that is not the human's. */
const darkLanerOf = (simulation: Simulation): string =>
  simulation
    .snapshot()
    .entities.find(
      ({ family, team, id }) =>
        family === 'legend' && team === 'dark' && id !== humanOf(simulation),
    )?.id ?? '';

describe('Simulation sim mode (FR-099, dev-set-controller)', () => {
  it('runs bot-versus-bot after the human is removed, with no violation, the same way twice', () => {
    const play = () => {
      const { simulation, logger } = newMatch();
      simulation.enqueueCommand({
        type: 'dev-set-controller',
        entityId: humanOf(simulation) ?? '',
        controllerId: 'rover',
      });
      run(simulation, 900);
      return { hash: simulation.hash(), human: humanOf(simulation), logger };
    };

    const [first, second] = [play(), play()];

    expect(first.human).toBeNull();
    expect(first.hash).toBe(second.hash);
    expect(first.logger.records.filter(({ severityText }) => severityText === 'ERROR')).toEqual([]);
  });

  it('re-adds the human to a chosen Legend: the AI lets go and the human commands rule', () => {
    const { simulation } = newMatch();
    const former = humanOf(simulation) ?? '';
    const chosen = darkLanerOf(simulation);
    run(simulation, 60);
    const walked = positionOf(simulation, chosen);
    expect(walked).not.toEqual(positionOf(simulation, former));

    simulation.enqueueCommand({
      type: 'dev-set-controller',
      entityId: chosen,
      controllerId: 'human',
    });
    simulation.step();
    simulation.enqueueCommand({ type: 'stop', actorId: chosen });
    run(simulation, 30);
    const stopped = positionOf(simulation, chosen);
    run(simulation, 300);

    expect(humanOf(simulation)).toBe(chosen);
    expect(positionOf(simulation, chosen)).toEqual(stopped);
    // The demoted human plays as a Rover bot: it keeps moving on its own.
    const before = positionOf(simulation, former);
    run(simulation, 300);
    expect(positionOf(simulation, former)).not.toEqual(before);
    // The former human is a Rover bot now; handing the new human back leaves nobody.
    simulation.enqueueCommand({
      type: 'dev-set-controller',
      entityId: chosen,
      controllerId: 'rover',
    });
    simulation.step();
    expect(humanOf(simulation)).toBeNull();
  });

  it('refuses an unknown entity, a non-Legend and an unknown controller', () => {
    const { simulation } = newMatch();
    const rejected: string[] = [];
    simulation.on('command-rejected', ({ reason }) => rejected.push(reason));
    const structure = simulation.snapshot().entities.find(({ family }) => family !== 'legend');
    const entityId = humanOf(simulation) ?? '';

    simulation.enqueueCommand({
      type: 'dev-set-controller',
      entityId: 'nobody',
      controllerId: 'human',
    });
    simulation.enqueueCommand({
      type: 'dev-set-controller',
      entityId: structure?.id ?? '',
      controllerId: 'human',
    });
    simulation.enqueueCommand({ type: 'dev-set-controller', entityId, controllerId: 'no-such' });
    simulation.step();

    expect(rejected).toEqual(['unknown-entity', 'not-a-legend', 'unknown-controller']);
    expect(humanOf(simulation)).toBe(entityId);
  });
});
