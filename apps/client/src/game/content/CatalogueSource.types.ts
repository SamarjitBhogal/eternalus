import type { DisplayCatalogue } from '../../bridge/catalogue.types';

/**
 * Port: where the display-ready content catalogue comes from (a `DisplayCatalogue`, defined in
 * `bridge/catalogue.types.ts`). `createCoreCatalogue` projects core content plus client presentation;
 * a test can swap the source in `main.tsx`.
 */
export interface CatalogueSource {
  /** Returns the catalogue; called once at construction of the session. */
  load(): DisplayCatalogue;
}
