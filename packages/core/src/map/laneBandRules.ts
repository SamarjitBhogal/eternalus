/** A `[from, to]` stretch of a lane as fractions of its length. */
export type LaneBand = readonly [number, number];

/** Whether `band` lies inside [0, 1] and does not run backwards. */
export const isBand = ([from, to]: LaneBand): boolean =>
  from >= 0 && from <= 1 && to >= 0 && to <= 1 && from <= to;

/** The two tower bands of a lane; a band is `undefined` when its kind has no tower to place. */
export type LaneBands = {
  readonly spawner: LaneBand | undefined;
  readonly buff: LaneBand | undefined;
};

/**
 * The rules the two tower bands of a lane must meet, as the messages of the broken ones: each is
 * a band inside [0, 1], and the spawner band lies ahead of the buff band. A rule about a band
 * that is not given does not apply. One rule set for the configured bands (`validateMapLayout`)
 * and for the ground the placed towers occupy (`laneTowerSpecs`, which passes `[first, last]` of
 * each kind that has a tower).
 */
export const brokenLaneBandRules = ({ spawner, buff }: LaneBands): readonly string[] => {
  const rules: readonly (readonly [boolean, string])[] = [
    [spawner !== undefined && !isBand(spawner), 'laneBands.spawner must be a band inside [0, 1]'],
    [buff !== undefined && !isBand(buff), 'laneBands.buff must be a band inside [0, 1]'],
    [
      spawner !== undefined && buff !== undefined && spawner[0] <= buff[1],
      'laneBands.spawner must lie ahead of laneBands.buff',
    ],
  ];
  return rules.filter(([isBroken]) => isBroken).map(([, message]) => message);
};
