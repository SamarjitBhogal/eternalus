import { describe, expect, it } from 'vitest';

import { Entity } from './Entity';
import { SpawnContextReader } from './SpawnContextReader';

class ReaderEntity extends Entity {
  public readonly kind = 'reader-kind';

  public readonly family = 'obstacle';

  protected attachComponents(): void {
    // The reader is tested directly; spawning is not needed.
  }
}

const DEFINITION = { id: 'reader-definition', kind: 'reader-kind', extra: 7 };
const POSITION = { x: 1, y: 2 };

describe('SpawnContextReader', () => {
  const reader = new SpawnContextReader(new ReaderEntity('entity-1', 'reader-definition'));

  it('reads a positioned context and keeps the full definition', () => {
    const context = reader.positioned<typeof DEFINITION>({
      definition: DEFINITION,
      position: POSITION,
    });

    expect(context.definition.extra).toBe(7);
    expect(context.position).toEqual(POSITION);
  });

  it('reads a placed context for each team', () => {
    for (const team of ['light', 'dark', 'neutral'] as const) {
      expect(reader.placed({ definition: DEFINITION, position: POSITION, team }).team).toBe(team);
    }
  });

  it('rejects a context without a usable definition or position', () => {
    const missing: unknown[] = [
      undefined,
      42,
      {},
      { definition: DEFINITION },
      { definition: { id: 'reader-definition' }, position: POSITION },
      { definition: DEFINITION, position: 'here' },
    ];

    for (const context of missing) {
      expect(() => reader.positioned(context)).toThrow(
        'Entity "entity-1" needs a spawn context with a definition and a position.',
      );
    }
  });

  it("rejects another entity's definition", () => {
    expect(() =>
      reader.positioned({ definition: { ...DEFINITION, id: 'other' }, position: POSITION }),
    ).toThrow('Entity "entity-1" (reader-kind, reader-definition) got definition "other"');
    expect(() =>
      reader.positioned({ definition: { ...DEFINITION, kind: 'other' }, position: POSITION }),
    ).toThrow('got definition "reader-definition" (other)');
  });

  it('rejects a placed context with a missing or unknown team', () => {
    for (const team of [undefined, 'purple', 1]) {
      expect(() => reader.placed({ definition: DEFINITION, position: POSITION, team })).toThrow(
        'Entity "entity-1" needs a spawn context with a team (light, dark or neutral).',
      );
    }
  });
});
