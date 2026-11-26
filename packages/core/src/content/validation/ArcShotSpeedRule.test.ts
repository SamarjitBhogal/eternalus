import { describe, expect, it } from 'vitest';

import { PROJECTILES } from '../projectiles/projectileCatalogue';
import { ArcShotSpeedRule } from './ArcShotSpeedRule';

const rule = new ArcShotSpeedRule();
const ORB = PROJECTILES.get('tower-orb');

describe('ArcShotSpeedRule', () => {
  it('accepts every shipped projectile: each arc shot flies at full speed to its range', () => {
    expect(PROJECTILES.all().flatMap((projectile) => rule.check(projectile))).toEqual([]);
  });

  it('flags an arc shot that slows before its range, and not a straight shot that does', () => {
    const slowing = { ...ORB, slowFrom: ORB.range - 1 };
    const straight = { ...slowing, isArc: false };

    expect(rule.check(slowing)).toEqual(['an arc shot needs slowFrom equal to range']);
    expect(rule.check(straight)).toEqual([]);
  });
});
