import { deepFreeze } from '../utils/deepFreeze';
import type { IdentifiedDefinition } from './ContentCatalogue.types';
import { ContentValidationError } from './ContentValidationError';
import { UnknownDefinitionError } from './UnknownDefinitionError';

/**
 * A read-only set of content definitions, looked up by id.
 *
 * @remarks Definitions are Flyweights shared by every entity built from them, so the catalogue
 * deep-freezes each one when it is created; nothing can change a definition at runtime. Ids are
 * unique, and definitions keep the order they were given in (character-select order for Legends).
 * @see docs/architecture/04-entity-architecture.md (Type Object definitions)
 */
export class ContentCatalogue<Definition extends IdentifiedDefinition> {
  private readonly definitions = new Map<string, Definition>();

  /**
   * Creates a catalogue from definitions and deep-freezes each one.
   *
   * @param definitions - The definitions, in display order.
   * @throws ContentValidationError when two definitions share an id.
   */
  public constructor(definitions: readonly Definition[]) {
    for (const definition of definitions) {
      if (this.definitions.has(definition.id)) {
        throw new ContentValidationError(`Duplicate definition id "${definition.id}".`);
      }

      this.definitions.set(definition.id, deepFreeze(definition));
    }
  }

  /** Every id, in catalogue order. */
  public get ids(): readonly string[] {
    return [...this.definitions.keys()];
  }

  /** Every definition, in catalogue order. */
  public all(): readonly Definition[] {
    return [...this.definitions.values()];
  }

  /** Whether a definition has the id `id`. */
  public has(id: string): boolean {
    return this.definitions.has(id);
  }

  /**
   * Returns the definition with the id `id`.
   *
   * @throws UnknownDefinitionError when no definition has that id (a dangling reference).
   */
  public get(id: string): Definition {
    const definition = this.definitions.get(id);

    if (definition === undefined) {
      throw new UnknownDefinitionError(id);
    }

    return definition;
  }
}
