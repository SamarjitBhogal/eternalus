import { describe, expect, it } from 'vitest';

import { ProjectileFlight } from './ProjectileFlight';

describe('ProjectileFlight', () => {
  it('holds the range and where the slowing starts', () => {
    const flight = new ProjectileFlight(100, 80, 4);

    expect(flight.range).toBe(100);
    expect(flight.slowFrom).toBe(80);
  });

  it('flies until it is ended: not ended, no ticks left, no share, and ticking does nothing', () => {
    const flight = new ProjectileFlight(100, 80, 4);

    expect(flight.isEnded).toBe(false);
    expect(flight.endTicksLeft).toBeNull();
    expect(flight.endingShare).toBe(0);
    expect(flight.tickEnding()).toBe(false);
    expect(flight.endTicksLeft).toBeNull();
  });

  it('counts its ending down, reports when it is over, and its share goes from 0 to 1', () => {
    const flight = new ProjectileFlight(100, 80, 4);

    flight.end();
    const shares = [flight.endingShare];
    const over: boolean[] = [];
    for (let tick = 0; tick < 4; tick += 1) {
      over.push(flight.tickEnding());
      shares.push(flight.endingShare);
    }

    expect(flight.isEnded).toBe(true);
    expect(over).toEqual([false, false, false, true]);
    expect(shares).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('keeps the ticks it has left when it is ended again', () => {
    const flight = new ProjectileFlight(100, 80, 4);
    flight.end();
    flight.tickEnding();

    flight.end();

    expect(flight.endTicksLeft).toBe(3);
  });
});
