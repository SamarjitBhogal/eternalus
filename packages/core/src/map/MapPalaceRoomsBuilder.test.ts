import { describe, expect, it } from 'vitest';
import { MapPalaceRoomsBuilder } from './MapPalaceRoomsBuilder';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
describe('MapPalaceRoomsBuilder', () => {
  it('furnishes and partitions all six rooms for both teams', () => {
    const map = {
      scenery: [
        ...new MapPalaceRoomsBuilder().build(0, 'light', P.light, 'light-stronghold'),
        ...new MapPalaceRoomsBuilder().build(0, 'dark', P.dark, 'dark-stronghold'),
      ],
    };
    for (const team of ['light', 'dark'])
      for (const room of ['council', 'library', 'kitchen', 'bedchamber', 'armory', 'dining']) {
        for (const part of [
          'floor',
          'wall-north',
          'wall-south',
          'wall-west',
          'wall-east',
          'doorway',
        ])
          expect(
            map.scenery.some((piece) => piece.id === `${team}-palace-interior-${room}-${part}`),
          ).toBe(true);
      }
    for (const team of ['light', 'dark'])
      for (const part of [
        'council-table',
        'library-shelf-0',
        'kitchen-hearth',
        'bedchamber-bed',
        'armory-rack-0',
        'dining-banquet',
      ])
        expect(map.scenery.some((p) => p.id === `${team}-palace-interior-${part}`)).toBe(true);
  });
});
