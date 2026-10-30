import { expect, it } from 'vitest';
import { MapObjectBody } from './MapObjectBody';

it('preserves the authored object identity and geometry', () => {
  const object = { id: 'house', kind: 'house' as const, isBlocking: true, footprints: [] };
  expect(new MapObjectBody(object).object).toBe(object);
});
