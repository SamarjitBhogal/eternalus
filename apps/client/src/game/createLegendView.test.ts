import { MemoryLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { createLegendView } from './createLegendView';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { LEGEND_SPRITE_SHEETS } from './legendSpriteSheets';
import { LEGEND_VISUAL_DIAMETER } from './views/entityViews.constants';
import { LegendSpriteView } from './views/LegendSpriteView';

/** The Knight's sheet, its atlas grid, and a frame function that always names its first frame. */
const KNIGHT = LEGEND_SPRITE_SHEETS.knight;
const KNIGHT_GROUND_OFFSET = KNIGHT?.groundOffset ?? Number.NaN;
const KNIGHT_GRID = { 'knight-sprites': { columns: 6, rows: 10 } };
const firstFrame = () => ({ atlasId: 'knight-sprites', frame: 0 });

describe('createLegendView', () => {
  it('keeps the ordinary Legend view, silently, for a pick without a sprite sheet', () => {
    const logger = new MemoryLogger();
    const view = createLegendView({
      sheet: undefined,
      renderer: new RecordingRenderer(KNIGHT_GRID),
      logger,
      frameOf: firstFrame,
    });

    expect(view).toBeUndefined();
    expect(logger.records).toEqual([]);
  });

  it('keeps the disc and logs one WARN when the atlas of the sheet did not load', () => {
    const logger = new MemoryLogger();
    const view = createLegendView({
      sheet: KNIGHT,
      renderer: new RecordingRenderer(),
      logger,
      frameOf: firstFrame,
    });

    expect(view).toBeUndefined();
    expect(
      logger.records.map(({ severityText, scope, attributes }) => [
        severityText,
        scope,
        attributes,
      ]),
    ).toEqual([['WARN', 'client.views', { atlasId: 'knight-sprites' }]]);
  });

  it('draws the sprite at the shared Legend width with the sheet ground offset', () => {
    const logger = new MemoryLogger();
    const view = createLegendView({
      sheet: KNIGHT,
      renderer: new RecordingRenderer(KNIGHT_GRID),
      logger,
      frameOf: firstFrame,
    });
    const renderer = new RecordingRenderer();
    const position = { x: 10, y: 20 };
    view?.draw(
      {
        entity: {
          id: 'hero',
          kind: 'knight',
          family: 'legend',
          definitionId: 'knight',
          team: 'light',
          transform: { ...position, radius: 0.75, facing: { x: 0, y: 1 } },
          health: { current: 800, max: 800 },
          aether: null,
          progression: null,
          area: null,
          capture: null,
          gem: null,
        },
        position,
        facing: { x: 0, y: 1 },
        isFocused: false,
      },
      renderer,
    );

    expect(view).toBeInstanceOf(LegendSpriteView);
    expect(renderer.calls[0]).toEqual({
      op: 'drawSprite',
      args: [
        firstFrame(),
        { x: 10, y: 20 + LEGEND_VISUAL_DIAMETER * KNIGHT_GROUND_OFFSET },
        LEGEND_VISUAL_DIAMETER,
      ],
    });
    expect(logger.records).toEqual([]);
  });
});
