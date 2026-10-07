import type { ContentCatalogue } from '../../bridge/events';

/**
 * Port: where the display-ready content catalogue comes from. `placeholderCatalogue` until core
 * content exists; swapping the source is one line in `main.tsx`.
 */
export interface CatalogueSource {
  /** Returns the catalogue; called once at construction of the session. */
  load(): ContentCatalogue;
}
