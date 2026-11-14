import { describe, expect, it } from 'vitest';

import { unitsWithWarriorKit } from '../__fixtures__/casterState';
import { abilityMatch } from '../__fixtures__/abilityMatch';

/** What the cast path said, without the statuses. */
const castLines = (log: readonly string[]) =>
  log.filter((line) => line.includes(' cast ') || line.includes(' rejected '));

describe('the shipped abilities refuse a cast with the right reason (scenario)', () => {
  it('not-enough-aether: three 35-aether Blade Runners in a row from 100 aether', () => {
    const { ids, cast, run, log } = abilityMatch(
      [{ kind: 'warrior', team: 'light', at: { x: 50, y: 50 } }],
      {
        content: unitsWithWarriorKit({
          abilities: ['blade-runner', 'blade-runner', 'blade-runner'],
          ultimate: 'fury',
        }),
      },
    );
    const id = ids[0] ?? '';

    cast(id, 'ability-1', { x: 60, y: 50 });
    run(1);
    cast(id, 'ability-2', { x: 60, y: 50 });
    run(1);
    cast(id, 'ability-3', { x: 60, y: 50 }); // 100 - 70 + two ticks of regen < 35
    run(1);

    expect(castLines(log)).toEqual([
      `1 cast ${id} blade-runner`,
      `2 cast ${id} blade-runner`,
      `3 rejected ${id} not-enough-aether`,
    ]);
  });

  it('cannot-cast: a Magus stunned by Blade Runner, a Warrior staggered by Shockwave', () => {
    const { ids, cast, run, log } = abilityMatch([
      { kind: 'warrior', team: 'light', at: { x: 50, y: 50 } },
      { kind: 'magus', team: 'dark', at: { x: 59.8, y: 50 } }, // off the path, in the end's stun circle
      { kind: 'magus', team: 'light', at: { x: 50, y: 70 } },
      { kind: 'warrior', team: 'dark', at: { x: 53, y: 70 } },
    ]);
    const [warrior, stunned, magus, staggered] = ids;

    cast(warrior ?? '', 'ability-1', { x: 70, y: 50 });
    cast(magus ?? '', 'ability-1', { x: 50, y: 70 });
    run(1);
    cast(stunned ?? '', 'ability-1', { x: 50, y: 50 });
    cast(staggered ?? '', 'ability-1', { x: 70, y: 70 });
    run(1);

    expect(castLines(log)).toEqual([
      `1 cast ${warrior ?? ''} blade-runner`,
      `1 cast ${magus ?? ''} shockwave`,
      `2 rejected ${stunned ?? ''} cannot-cast`,
      `2 rejected ${staggered ?? ''} cannot-cast`,
    ]);
  });

  it('casts again once the 0.3 s (9 tick) stagger is over, not a tick sooner', () => {
    const { ids, cast, run, log } = abilityMatch([
      { kind: 'magus', team: 'light', at: { x: 50, y: 70 } },
      { kind: 'warrior', team: 'dark', at: { x: 53, y: 70 } },
    ]);
    const [magus, warrior] = ids;

    cast(magus ?? '', 'ability-1', { x: 50, y: 70 }); // staggers the Warrior in tick 1
    run(9);
    // Casts are checked before statuses expire in a tick (plan arch call 13), so the stagger
    // blocks the checks of ticks 2 to 10: nine ticks, as long as it lasts.
    cast(warrior ?? '', 'ability-1', { x: 70, y: 70 });
    run(1);
    cast(warrior ?? '', 'ability-1', { x: 70, y: 70 });
    run(1);

    expect(castLines(log)).toEqual([
      `1 cast ${magus ?? ''} shockwave`,
      `10 rejected ${warrior ?? ''} cannot-cast`,
      `11 cast ${warrior ?? ''} blade-runner`,
    ]);
  });

  it('unavailable: an ability in the kit that is not built yet (Veil, effects: [])', () => {
    const { ids, cast, run, log } = abilityMatch([
      { kind: 'warrior', team: 'light', at: { x: 50, y: 50 } },
    ]);
    const id = ids[0] ?? '';

    cast(id, 'ability-2', { x: 60, y: 50 });
    run(1);

    expect(castLines(log)).toEqual([`1 rejected ${id} unavailable`]);
  });
});
