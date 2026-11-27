import { describe, expect, it } from 'vitest';

import type { AbilityEffectSpec } from '../content/abilities/AbilityDefinition.types';
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

  it('shortens its range to an aim point, keeps slowFrom within it, and never lengthens it', () => {
    const flight = new ProjectileFlight(100, 80, 4, true);

    flight.shortenTo(60);
    expect([flight.range, flight.slowFrom, flight.isArc]).toEqual([60, 60, true]);
    flight.shortenTo(90);
    expect([flight.range, flight.slowFrom]).toEqual([60, 60]);
    flight.shortenTo(-5);
    expect([flight.range, flight.slowFrom]).toEqual([0, 0]);
    expect(new ProjectileFlight(100, 80, 4).isArc).toBe(false);
  });

  describe('lit shots (HC-Q89, DEC-345)', () => {
    const BURN: readonly AbilityEffectSpec[] = [
      { kind: 'debuff', statusId: 'burn', shape: { kind: 'hit' } },
    ];

    it('catches fire once: light() sets isLit for a shot that has lit-on-hit steps', () => {
      const flight = new ProjectileFlight(100, 80, 4, false, BURN);

      expect(flight.canLight).toBe(true);
      expect(flight.isLit).toBe(false);
      expect(flight.litOnHit).toBe(BURN);
      flight.light();
      flight.light();
      expect(flight.isLit).toBe(true);
    });

    it('cannot catch fire with no steps: light() leaves it unlit', () => {
      const flight = new ProjectileFlight(100, 80, 4);

      expect(flight.canLight).toBe(false);
      expect(flight.litOnHit).toEqual([]);
      flight.light();
      expect(flight.isLit).toBe(false);
    });
  });
});
