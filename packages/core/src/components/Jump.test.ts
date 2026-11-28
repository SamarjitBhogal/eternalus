import { describe, expect, it } from 'vitest';

import { Jump } from './Jump';

const ARC = { airTicks: 4, peakHeight: 2 };

describe('Jump', () => {
  it('starts on the ground with the key released', () => {
    const jump = new Jump();

    expect(jump.isHeld).toBe(false);
    expect(jump.isAirborne).toBe(false);
    expect(jump.height).toBe(0);
    expect(jump.velocity).toEqual({ x: 0, y: 0 });
    expect(jump.fields).toEqual([false, null, 0, 0]);
  });

  it('records the held key', () => {
    const jump = new Jump();

    jump.hold(true);
    expect(jump.isHeld).toBe(true);
    jump.hold(false);
    expect(jump.isHeld).toBe(false);
  });

  it('keeps a copy of the takeoff velocity', () => {
    const jump = new Jump();
    const velocity = { x: 3, y: -1 };

    jump.takeOff(velocity);
    velocity.x = 9;

    expect(jump.isAirborne).toBe(true);
    expect(jump.velocity).toEqual({ x: 3, y: -1 });
    expect(jump.fields).toEqual([false, 0, 3, -1]);
  });

  it('flies a parabola that peaks halfway and lands after the air time', () => {
    const jump = new Jump();
    jump.takeOff({ x: 1, y: 0 });
    const heights = [jump.height];

    for (let tick = 1; tick < ARC.airTicks; tick += 1) {
      jump.advance(ARC);
      heights.push(jump.height);
      expect(jump.isAirborne).toBe(true);
    }
    jump.advance(ARC);

    // 4 · peak · t · (T − t) / T², T = 4.
    expect(heights).toEqual([0, 1.5, 2, 1.5]);
    expect(jump.isAirborne).toBe(false);
    expect(jump.height).toBe(0);
    expect(jump.velocity).toEqual({ x: 0, y: 0 });
  });

  it('does nothing on the ground', () => {
    const jump = new Jump();

    jump.advance(ARC);

    expect(jump.isAirborne).toBe(false);
    expect(jump.height).toBe(0);
  });

  it('lands and releases the key on reset', () => {
    const jump = new Jump();
    jump.hold(true);
    jump.takeOff({ x: 1, y: 1 });
    jump.advance(ARC);

    jump.reset();

    expect(jump.fields).toEqual([false, null, 0, 0]);
    expect(jump.height).toBe(0);
  });
});
