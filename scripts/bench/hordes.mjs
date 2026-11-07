// Headless tick bench (`npm run bench`; plan Phase 1 "Headless bench", minion plan §1.2
// "Unit-cap performance"): a generated 3-lane match with every bot Legend, filled with lane
// hordes to the Phase 3 target and to the unit cap (`limits.maxUnitsPerTeam`), times
// `Simulation.step()` and prints p50/p95/max tick time. Core is loaded through Vite's module
// runner, since Node cannot resolve its extensionless TypeScript imports. Times are printed,
// never asserted (they depend on the machine); the script fails only when a case could not be
// filled, so CI notices when the core API it drives changes. Per-system times wait for the
// `Profiler` port (architecture 15 §6, Phase 6).
import { performance } from 'node:perf_hooks';
import { runnerImport } from 'vite';

/** Ticks run after the spawn, before timing, so the hordes have formed and started to march. */
const WARM_UP_TICKS = 60;
/** Ticks timed per case: 30 s of match time, enough for the hordes to meet and fight. */
const TIMED_TICKS = 900;
/** The tick budget of architecture 08 §9 and the plan README (p95, ms). */
const BUDGET_MS = 8;
/** Mobs per team in the Phase 3 tick target ("144 units/team + 20 Legends", plan README §5). */
const PHASE_3_TARGET_MOBS = 144;

const { module: core } = await runnerImport('./packages/core/src/index.ts', {
  configFile: false,
  logLevel: 'silent',
});
const { createDefaultGameConfig, MapGenerator, NullLogger, Simulation } = core;

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

/** Each team's bot Legends: `legendsPerTeam` - 1 laners cycling the classes, and the Rover. */
const rosterOf = (config) =>
  ['light', 'dark'].flatMap((team) => [
    ...Array.from({ length: config.match.legendsPerTeam - 1 }, (_, index) => ({
      team,
      definitionId: ['warrior', 'sentinel', 'magus'][index % 3],
      role: 'laner',
      difficulty: 'normal',
    })),
    { team, definitionId: 'warrior', role: 'rover', difficulty: 'rover' },
  ]);

const config = createDefaultGameConfig({ map: { numLanes: 3 } });

/**
 * One case: a generated 3-lane match with every bot Legend; after the first tick (opening hordes,
 * guards), each team is filled to exactly `perTeam` mobs with light minions, one horde per lane,
 * Light at 45% of each lane and Dark at 55%, so the hordes meet and fight while the ticks are
 * timed.
 *
 * @throws Error when a team holds fewer than `perTeam` mobs after the spawn.
 */
const runCase = (perTeam) => {
  const map = new MapGenerator().generate(config, 1);
  const simulation = new Simulation({
    config,
    seed: 1,
    logger: new NullLogger(),
    map,
    roster: rosterOf(config),
  });
  simulation.step();
  const before = mobsByTeam(simulation);
  for (const [team, t] of [
    ['light', 0.45],
    ['dark', 0.55],
  ]) {
    const missing = Math.max(0, perTeam - before[team]);
    map.lanes.forEach((lane, index) => {
      const count =
        Math.floor(missing / map.lanes.length) + (index < missing % map.lanes.length ? 1 : 0);
      if (count > 0) {
        simulation.enqueueCommand({
          type: 'dev-spawn-mobs',
          team,
          definitionId: 'light-minion',
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
  for (let tick = 1; tick < WARM_UP_TICKS; tick += 1) simulation.step();
  const atStart = mobsByTeam(simulation);
  const times = [];
  for (let tick = 0; tick < TIMED_TICKS; tick += 1) {
    const started = performance.now();
    simulation.step();
    times.push(performance.now() - started);
  }
  times.sort((a, b) => a - b);
  return {
    case: `${perTeam} mobs per team + ${config.match.legendsPerTeam} Legends`,
    'mobs at start (L/D)': `${atStart.light}/${atStart.dark}`,
    'mobs at end (L/D)': Object.values(mobsByTeam(simulation)).join('/'),
    'p50 ms': quantile(times, 0.5).toFixed(2),
    'p95 ms': quantile(times, 0.95).toFixed(2),
    'max ms': times[times.length - 1].toFixed(2),
    [`p95 ≤ ${BUDGET_MS} ms`]: quantile(times, 0.95) <= BUDGET_MS ? 'yes' : 'NO',
  };
};

console.log(
  `Node ${process.version}; ${TIMED_TICKS} ticks timed per case after ${WARM_UP_TICKS} warm-up ticks`,
);
const capMobs = config.limits.maxUnitsPerTeam - config.match.legendsPerTeam;
console.table([PHASE_3_TARGET_MOBS, capMobs].map(runCase));
