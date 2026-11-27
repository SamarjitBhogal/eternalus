import { describe, expect, it } from 'vitest';

import type { MapFeature } from '../content/maps/maps.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { StructureDefinition } from '../content/structures/structures.types';
import { MapGenerationError } from './MapGenerationError';
import { structureBodiesOf } from './structureBodiesOf';

const feature = (id: string, definitionId: string): MapFeature => ({
  id,
  kind: 'obstacle',
  team: 'neutral',
  definitionId,
  position: { x: 0, y: 0 },
  minimapGlyph: { shape: 'dot', size: 1, colourRole: 'neutral' },
});

const object = (id: string, isBlocking: boolean, partOf?: string): MapObject => ({
  id,
  kind: 'wall',
  footprints: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  ],
  isBlocking,
  ...(partOf === undefined ? {} : { partOf }),
});

/**
 * Structure definitions by id: a lane tower, a gate and a turret have a map footprint, the
 * Stronghold not; the turret is mounted on its own (DEC-388).
 */
type BodyRules = Pick<StructureDefinition, 'hasMapFootprint' | 'isMounted'>;
const DEFINITIONS = new Map<string, BodyRules>([
  ['lane-tower', { hasMapFootprint: true }],
  ['gate', { hasMapFootprint: true }],
  ['turret', { hasMapFootprint: true, isMounted: true }],
  ['stronghold', {}],
]);
const STRUCTURES = {
  has: (id: string): boolean => DEFINITIONS.has(id),
  get: (id: string): BodyRules => {
    const definition = DEFINITIONS.get(id);
    if (definition === undefined) throw new Error(`No structure ${id}`);
    return definition;
  },
};

describe('structureBodiesOf', () => {
  it('gives each structure feature, in id order, its own object, its parts and its blocking body ids', () => {
    const fort = object('b-tower', true);
    const passage = object('a-gate', false);
    const floor = object('dark-stronghold', false);
    const outer = object('outer-0', true, 'dark-stronghold');
    const throne = object('throne', true, 'dark-stronghold');
    const features = [
      feature('dark-stronghold', 'stronghold'),
      feature('tree-1', 'tree'),
      feature('b-tower', 'lane-tower'),
      feature('a-gate', 'gate'),
    ];

    const bodies = structureBodiesOf(
      features,
      [floor, outer, passage, fort, throne, object('rock', true)],
      STRUCTURES,
    );

    expect(bodies.map(({ feature: { id } }) => id)).toEqual([
      'a-gate',
      'b-tower',
      'dark-stronghold',
    ]);
    // A gate's own object does not block: its outline, not a body without health.
    expect(bodies[0]).toEqual({ feature: features[3], own: passage, parts: [], bodyIds: [] });
    expect(bodies[1]).toEqual({ feature: features[2], own: fort, parts: [], bodyIds: ['b-tower'] });
    // The Stronghold has no map footprint: the palace floor is not its own (DEC-344 (4)).
    expect(bodies[2]).toEqual({
      feature: features[0],
      own: undefined,
      parts: [outer, throne],
      bodyIds: ['outer-0', 'throne'],
    });
  });

  it('gives a structure with no object of its id and no parts an empty body', () => {
    const bodies = structureBodiesOf([feature('b-tower', 'lane-tower')], [], STRUCTURES);

    expect(bodies).toEqual([
      { feature: feature('b-tower', 'lane-tower'), own: undefined, parts: [], bodyIds: [] },
    ]);
  });

  it('gives a mounted structure its own object as its mount, not as a body (DEC-388)', () => {
    const pylon = object('north-turret', true);

    const bodies = structureBodiesOf([feature('north-turret', 'turret')], [pylon], STRUCTURES);

    expect(bodies).toEqual([
      {
        feature: feature('north-turret', 'turret'),
        own: pylon,
        parts: [],
        bodyIds: [],
        mountId: 'north-turret',
      },
    ]);
  });

  it('passes on the error for a part of a feature that is no structure (Q104-13)', () => {
    expect(() =>
      structureBodiesOf(
        [feature('west-wall', 'wall-segment')],
        [object('stray', true, 'west-wall')],
        STRUCTURES,
      ),
    ).toThrow(MapGenerationError);
  });
});
