// Headless tick bench (`npm run bench`; plan Phase 1 "Headless bench", minion plan §1.2
// "Unit-cap performance"): a generated 3-lane match with every bot Legend of the shipped bot
// roster, filled with lane hordes to the Phase 3 target and to the unit cap
// (`limits.maxUnitsPerTeam`), times `Simulation.step()` and prints p50/p95/max tick time. Core is
// loaded through Vite's module runner, since Node cannot resolve its extensionless TypeScript
// imports. Times are printed, never asserted (they depend on the machine): a missed budget prints
// `NO` and still exits 0.
// The timed window is a fight, so the population falls from the fill (the mob counts at its start
// and end are printed); whether NFR-021 needs it held at 144 per team is open (INBOX).
// The script fails when it stops measuring its scenario, so CI notices when the core API it
// drives changes: a case that could not be filled, a bot Legend that never travelled, hordes that
// never met, or a timed window in which no filled mob died. Per-system times (NFR-025) wait for
// the `Profiler` port (architecture 15 §6, Phase 6).
import { performance } from 'node:perf_hooks';
import { runnerImport } from 'vite';

/** Match time timed per case, taken once the hordes fight (s). */
const TIMED_SECONDS = 30;
/** The most match time after the countdown to wait for the first filled mob to die (s). */
const MAX_CONTACT_SECONDS = 100;
/**
 * How far every Legend must travel from the end of the countdown to the first death. A bot walks
 * 34 units or more towards its lane by then (seed 1); a push from the fight moves a Legend with no
 * controller far less.
 */
const MIN_LEGEND_TRAVEL = 10;
/** The tick budget of architecture 08 §9 and the plan README (p95, ms). */
const BUDGET_MS = 8;
/** Mobs per team in the Phase 3 tick target ("144 units/team + 20 Legends", plan README §5). */
const PHASE_3_TARGET_MOBS = 144;
/** The Rovers' class: the roster's Rover copies the player's (`mirror-player`); there is none here. */
const ROVER_CLASS = 'warrior';
/** The mob the fill spawns. */
const FILL_MOB = 'light-minion';
/** Where each team's fill spawns, as a fraction of each lane: the two hordes meet in the middle. */
const FILL_LANE_T = { light: 0.45, dark: 0.55 };

const { module: core } = await runnerImport('./packages/core/src/index.ts', {
  configFile: false,
  logLevel: 'silent',
});
const { createDefaultGameConfig, loadDisplayContent, MapGenerator, NullLogger, Simulation } = core;

/** The ids of every mob of a playable team in `snapshot`. */
const mobIdsOf = (snapshot) =>
  new Set(
    snapshot.entities
      .filter(({ team, family }) => (team === 'light' || team === 'dark') && family === 'mob')
      .map(({ id }) => id),
  );

/** Whether a mob of `ids` is gone from `simulation`'s snapshot (it died). */
const hasLostOneOf = (simulation, ids) => {
  const now = mobIdsOf(simulation.snapshot());
  return [...ids].some((id) => !now.has(id));
};

/** Each Legend's position in `simulation`'s snapshot, by id. */
const legendPositions = (simulation) =>
  new Map(
    simulation
      .snapshot()
      .entities.filter(({ family }) => family === 'legend')
      .map(({ id, transform }) => [id, transform]),
  );

/** The value at quantile `q` of an ascending list. */
const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];

/** How many mobs (minions, guards) each playable team has in `simulation`'s snapshot. */
const mobsByTeam = (simulation) => {
  const counts = { light: 0, dark: 0 };
  for (const { team, family } of simulation.snapshot().entities) {
    if ((team === 'light' || team === 'dark') && family === 'mob') counts[team] += 1;
  }
  return counts;
};

/**
 * Each team's bot Legends from the shipped bot roster (content `botRoster`): its laners in roster
 * order, so each lane gets the shipped class mix (DEC-102), and a Rover playing `ROVER_CLASS`.
 */
const rosterOf = ({ laners, difficulties }) =>
  ['light', 'dark'].flatMap((team) => [
    ...laners.map((definitionId) => ({
      team,
      pilot: 'bot',
      definitionId,
      role: 'laner',
      difficulty: difficulties.laner,
    })),
    {
      team,
      pilot: 'bot',
      definitionId: ROVER_CLASS,
      role: 'rover',
      difficulty: difficulties.rover,
    },
  ]);

const config = createDefaultGameConfig({ map: { numLanes: 3 } });
const roster = rosterOf(loadDisplayContent().botRoster);
const TIMED_TICKS = TIMED_SECONDS * config.tickRate;
const MAX_CONTACT_TICKS = MAX_CONTACT_SECONDS * config.tickRate;

/**
 * A generated 3-lane match with every bot Legend; after the first tick (opening hordes, guards),
 * each team is filled to exactly `perTeam` mobs of `FILL_MOB`, one horde per lane, at
 * `FILL_LANE_T` of each lane.
 *
 * @throws Error when a team holds fewer than `perTeam` mobs after the spawn.
 */
const filledMatch = (perTeam) => {
  const map = new MapGenerator().generate(config, 1);
  const simulation = new Simulation({ config, seed: 1, logger: new NullLogger(), map, roster });
  simulation.step();
  const before = mobsByTeam(simulation);
  for (const [team, t] of Object.entries(FILL_LANE_T)) {
    const missing = Math.max(0, perTeam - before[team]);
    map.lanes.forEach((lane, index) => {
      const count =
        Math.floor(missing / map.lanes.length) + (index < missing % map.lanes.length ? 1 : 0);
      if (count > 0) {
        simulation.enqueueCommand({
          type: 'dev-spawn-mobs',
          team,
          definitionId: FILL_MOB,
          count,
          origin: { kind: 'lane', lane: lane.id, t },
        });
      }
    });
  }
  simulation.step();
  const filled = mobsByTeam(simulation);
  if (filled.light < perTeam || filled.dark < perTeam) {
    throw new Error(`Filled ${filled.light}/${filled.dark} of ${perTeam} mobs per team`);
  }
  return simulation;
};

/**
 * Steps `simulation` through the countdown freeze and on until one of its current mobs dies.
 *
 * @returns The ticks after the countdown until that death.
 * @throws Error when no mob dies in `MAX_CONTACT_TICKS`, or a Legend travelled less than
 *   `MIN_LEGEND_TRAVEL` by then (it has no bot controller).
 */
const stepToContact = (simulation) => {
  const filledIds = mobIdsOf(simulation.snapshot());
  while (simulation.snapshot().match.phase === 'countdown') simulation.step();
  const atCountdownEnd = legendPositions(simulation);
  let contactTicks = 0;
  while (!hasLostOneOf(simulation, filledIds)) {
    if (contactTicks === MAX_CONTACT_TICKS) {
      throw new Error(`No filled mob died in ${MAX_CONTACT_TICKS} ticks: the hordes never met`);
    }
    simulation.step();
    contactTicks += 1;
  }
  const idle = [...legendPositions(simulation)].filter(([id, { x, y }]) => {
    const from = atCountdownEnd.get(id);
    return from === undefined || Math.hypot(x - from.x, y - from.y) < MIN_LEGEND_TRAVEL;
  });
  if (idle.length > 0) {
    throw new Error(
      `${idle.length} Legends travelled under ${MIN_LEGEND_TRAVEL} units after the countdown: no bot controller`,
    );
  }
  return contactTicks;
};

/**
 * Times `TIMED_TICKS` calls of `simulation.step()`.
 *
 * @returns The tick times in ms, ascending.
 * @throws Error when none of the mobs alive at the start dies while timed.
 */
const timeTicks = (simulation) => {
  const timedIds = mobIdsOf(simulation.snapshot());
  const times = [];
  for (let tick = 0; tick < TIMED_TICKS; tick += 1) {
    const started = performance.now();
    simulation.step();
    times.push(performance.now() - started);
  }
  if (!hasLostOneOf(simulation, timedIds)) {
    throw new Error(`No mob died in the ${TIMED_TICKS} timed ticks: the hordes did not fight`);
  }
  return times.sort((a, b) => a - b);
};

/**
 * One case: fill a match to `perTeam` mobs per team, run it to the first death, then time a fight.
 *
 * @param budgetMs - The p95 target for this case, or `null` where none is set.
 */
const runCase = (perTeam, budgetMs) => {
  const simulation = filledMatch(perTeam);
  const contactTicks = stepToContact(simulation);
  const atStart = mobsByTeam(simulation);
  const times = timeTicks(simulation);
  const p95 = quantile(times, 0.95);
  return {
    case: `${perTeam} mobs per team + ${config.match.legendsPerTeam} Legends`,
    'contact after countdown (ticks)': contactTicks,
    'mobs at start (L/D)': `${atStart.light}/${atStart.dark}`,
    'mobs at end (L/D)': Object.values(mobsByTeam(simulation)).join('/'),
    'p50 ms': quantile(times, 0.5).toFixed(2),
    'p95 ms': p95.toFixed(2),
    'max ms': times[times.length - 1].toFixed(2),
    [`p95 ≤ ${BUDGET_MS} ms (combat window)`]:
      budgetMs === null ? 'no target (INBOX DEC-137 (1))' : p95 <= budgetMs ? 'yes' : 'NO',
  };
};

console.log(
  `Node ${process.version}; ${TIMED_TICKS} ticks timed per case, from the first death after the countdown`,
);
// The timed population falls from the fill, so the budget column is combat-window evidence; whether
// NFR-021 needs 144 per team held for the whole window is open (INBOX).
console.log('Budget column: combat-window evidence only, not an NFR-021 pass (sampling rule open)');
const capMobs = config.limits.maxUnitsPerTeam - config.match.legendsPerTeam;
// The budget applies to the Phase 3 target only: whether it holds at the cap is open (INBOX DEC-137 (1)).
console.table([runCase(PHASE_3_TARGET_MOBS, BUDGET_MS), runCase(capMobs, null)]);
