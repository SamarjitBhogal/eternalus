import type { MapLayout } from '../content/maps/maps.types';

/** A `[from, to]` stretch of a lane as fractions of its length. */
export type LaneBand = readonly [number, number];

/** Whether `band` lies inside [0, 1] and does not run backwards. */
export const isBand = ([from, to]: LaneBand): boolean =>
  from >= 0 && from <= 1 && to >= 0 && to <= 1 && from <= to;

/**
 * The rules the two tower bands of a lane must meet, as the messages of the broken ones: each is
 * a band inside [0, 1], and the spawner band lies ahead of the buff band. One rule set for the
 * configured bands (`validateMapLayout`) and for the bands as widened to fit a tower count
 * (`laneTowerSpecs`).
 */
export const brokenLaneBandRules = (bands: MapLayout['laneBands']): readonly string[] =>
  [
    [!isBand(bands.spawner), 'laneBands.spawner must be a band inside [0, 1]'],
    [!isBand(bands.buff), 'laneBands.buff must be a band inside [0, 1]'],
    [bands.spawner[0] <= bands.buff[1], 'laneBands.spawner must lie ahead of laneBands.buff'],
  ].flatMap(([isBroken, message]) => (isBroken === true ? [String(message)] : []));
