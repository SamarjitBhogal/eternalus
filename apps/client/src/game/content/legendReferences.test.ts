import { describe, expect, it } from 'vitest';
import { SPEC_PRESENTATION } from './classPresentation';
import { LEGEND_SKINS } from '../LegendAnimation.constants';
import { LEGEND_REFERENCE_ASSETS } from '../../data/resources/legendReferenceAssets';
import { LEGEND_SPRITE_ASSETS } from '../../data/resources/legendSpriteAssets';

describe('confirmed character reference mapping', () => {
  it.each(['assassin', 'knight', 'paladin', 'colossus', 'juggernaut'])(
    'connects %s selection and world art through registered assets',
    (id) => {
      expect(SPEC_PRESENTATION[id]?.art.card).toBe(`${id}-reference-art`);
      expect(SPEC_PRESENTATION[id]?.art.portrait).toBe(`${id}-reference-art`);
      expect(
        LEGEND_REFERENCE_ASSETS.some((asset) => asset.id === SPEC_PRESENTATION[id]?.art.card),
      ).toBe(true);
      const sprite = LEGEND_SPRITE_ASSETS.find((asset) => asset.id === LEGEND_SKINS[id]);
      expect(sprite?.type).toBe('sprite-atlas');
      if (sprite?.type !== 'sprite-atlas') throw new Error('Missing sprite sheet');
      expect([sprite.columns, sprite.rows]).toEqual([6, 10]);
    },
  );
});
