import type { ControllerRegistry } from '../ai/defaultControllerRegistry';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import type { EntityFactory } from '../entities/EntityFactory';
import type { DefinitionSource } from '../entities/EntityFactory.types';

/** What `loadMatchContent` returns: the content and the factory one match is built with. */
export type MatchContent = {
  readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'has' | 'get'>;
  readonly controllers: ControllerRegistry;
  readonly units: DefinitionSource;
  readonly factory: EntityFactory;
};
