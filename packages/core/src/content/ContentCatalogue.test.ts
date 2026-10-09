import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from './ContentCatalogue';
import { ContentValidationError } from './ContentValidationError';
import { UnknownDefinitionError } from './UnknownDefinitionError';

type FakeDefinition = {
  readonly id: string;
  readonly stats: { readonly speed: number; readonly tags: readonly string[] };
};

const fake = (id: string, speed = 1): FakeDefinition => ({ id, stats: { speed, tags: ['a'] } });

describe('ContentCatalogue', () => {
  it('looks definitions up by id and keeps their order', () => {
    const catalogue = new ContentCatalogue([fake('b-unit'), fake('a-unit')]);

    expect(catalogue.ids).toEqual(['b-unit', 'a-unit']);
    expect(catalogue.all().map((definition) => definition.id)).toEqual(['b-unit', 'a-unit']);
    expect(catalogue.get('a-unit').id).toBe('a-unit');
    expect(catalogue.has('a-unit')).toBe(true);
    expect(catalogue.has('c-unit')).toBe(false);
  });

  it('throws UnknownDefinitionError for a dangling id', () => {
    const catalogue = new ContentCatalogue([fake('a-unit')]);

    expect(() => catalogue.get('no-such-unit')).toThrow(UnknownDefinitionError);
    expect(() => catalogue.get('no-such-unit')).toThrow('Unknown definition id "no-such-unit".');
  });

  it('rejects two definitions with the same id', () => {
    expect(() => new ContentCatalogue([fake('a-unit'), fake('a-unit', 2)])).toThrow(
      ContentValidationError,
    );
    expect(() => new ContentCatalogue([fake('a-unit'), fake('a-unit', 2)])).toThrow(
      'Duplicate definition id "a-unit".',
    );
  });

  it('deep-freezes every definition so shared data cannot change', () => {
    const definition = fake('a-unit');
    const catalogue = new ContentCatalogue([definition]);

    expect(Object.isFrozen(catalogue.get('a-unit'))).toBe(true);
    expect(Object.isFrozen(definition.stats)).toBe(true);
    expect(Object.isFrozen(definition.stats.tags)).toBe(true);
    expect(() => {
      Object.assign(definition.stats, { speed: 99 });
    }).toThrow(TypeError);
  });

  it('accepts definitions that are already frozen or shared with another catalogue', () => {
    const shared = fake('a-unit');
    const first = new ContentCatalogue([shared]);
    const second = new ContentCatalogue([shared]);

    expect(second.get('a-unit')).toBe(first.get('a-unit'));
  });

  it('hands out copies of its id and definition lists', () => {
    const catalogue = new ContentCatalogue([fake('a-unit')]);

    expect(catalogue.all()).not.toBe(catalogue.all());
    expect(catalogue.ids).not.toBe(catalogue.ids);
  });
});
