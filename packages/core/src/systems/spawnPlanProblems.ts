import type { SpawnWaveDefinition } from '../content/structures/structures.types';
import type { SpawnPlan } from './SpawnSystem.types';

/**
 * What is wrong with `plan` on one map (`SpawnSystem`'s check when the match is built): a wave of
 * `waves` (source, wave) naming an unknown mob or a mob of another weight class, a guard plan of a
 * home in `homes` (by definition id) naming an unknown mob, and, when the map `hasCapturePoints`,
 * a checkpoint defender row naming an unknown mob. Each problem once.
 */
export const spawnPlanProblems = (
  plan: Pick<SpawnPlan, 'definitions' | 'guards' | 'defenders'>,
  waves: readonly (readonly [string, Pick<SpawnWaveDefinition, 'mobId' | 'weightClass'>])[],
  homes: ReadonlySet<string>,
  hasCapturePoints: boolean,
): string[] => {
  const { definitions, guards, defenders } = plan;
  // Only the plans of structures and zones on this map, so a match without them needs no guard
  // content.
  const guardProblems = [...homes].flatMap((id) =>
    (guards[id]?.table ?? []).flatMap(({ mobId }) =>
      definitions.has(mobId) ? [] : [`${id} guard plan names unknown mob "${mobId}"`],
    ),
  );
  // Only on a map with capture points, so a match without them needs no defender content.
  const defenderProblems = Object.entries(hasCapturePoints ? defenders : {}).flatMap(
    ([checkpoint, { table }]) =>
      table.flatMap(({ mobId }) =>
        definitions.has(mobId)
          ? []
          : [`checkpoint ${checkpoint} defenders name unknown mob "${mobId}"`],
      ),
  );
  const mobProblems = waves.flatMap(([source, { mobId, weightClass }]) => {
    if (!definitions.has(mobId)) {
      return [`${source} wave names unknown mob "${mobId}"`];
    }
    const { kind } = definitions.get(mobId);
    return kind === `${weightClass}-mob`
      ? []
      : [`${source} wave says "${mobId}" is ${weightClass}, but its kind is "${kind}"`];
  });
  return [...new Set([...guardProblems, ...defenderProblems, ...mobProblems])];
};
