import type { EntityDefinitionBase } from './EntityDefinition.types';

/**
 * The kinds that build one family of definitions, as a runtime set, so rules and systems key on a
 * definition's kind (not on which fields it happens to have) and narrow it without a cast.
 */
export class KindSet<Definition extends EntityDefinitionBase> {
  private readonly kinds: ReadonlySet<string>;

  /** @param kinds - Every kind that builds a `Definition`. */
  public constructor(kinds: readonly Definition['kind'][]) {
    this.kinds = new Set(kinds);
  }

  /** Whether `definition` is a `Definition`, judged by its kind. */
  public has(definition: EntityDefinitionBase): definition is Definition {
    return this.kinds.has(definition.kind);
  }
}
