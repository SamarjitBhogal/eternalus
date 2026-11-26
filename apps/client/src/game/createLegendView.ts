import { type EntitySnapshot, type Logger, makeLogRecord } from '@eternalus/core';

import type { Renderer } from './engine/render/Renderer';
import type { SpriteRef } from './engine/render/Renderer.types';
import type { LegendSpriteSheet } from './legendSpriteSheets.types';
import type { EntityView } from './views/EntityView.types';
import { LEGEND_VISUAL_DIAMETER } from './views/entityViews.constants';
import { LegendSpriteView } from './views/LegendSpriteView';

/**
 * The Legend family's view for one match (DEC-298 (6): only the player's Legend gets a sprite):
 * a `LegendSpriteView` when `renderer` holds the atlas of the player's `sheet`, else `undefined`,
 * and the view registry keeps its ordinary Legend view. A sheet whose atlas did not load (the
 * resource controller has already warned about the file) logs one more WARN here, and the
 * player's Legend is drawn as a disc; the match still starts.
 */
export function createLegendView(deps: {
  readonly sheet: LegendSpriteSheet | undefined;
  readonly renderer: Pick<Renderer, 'hasSprite'>;
  readonly logger: Logger;
  readonly frameOf: (entity: EntitySnapshot) => SpriteRef | null;
}): EntityView | undefined {
  const { sheet, renderer, logger, frameOf } = deps;
  if (sheet === undefined) {
    return undefined;
  }
  if (!renderer.hasSprite({ atlasId: sheet.atlasId, frame: 0 })) {
    logger.log(
      makeLogRecord('WARN', 'client.views', 'The sprite atlas is not loaded; drawing the disc.', {
        attributes: { atlasId: sheet.atlasId },
      }),
    );
    return undefined;
  }
  return new LegendSpriteView(frameOf, LEGEND_VISUAL_DIAMETER, sheet.groundOffset);
}
