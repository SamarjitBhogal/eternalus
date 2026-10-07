import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { LEGEND_CLASSES } from '../legends/legendClasses';
import type { UnitDefinition } from '../units/units.types';
import { ContentValidator } from './ContentValidator';
import type { UnitDefinitionRule } from './ContentValidator.types';

class NoMagusRule implements UnitDefinitionRule {
  public check(definition: UnitDefinition): readonly string[] {
    return definition.id === 'magus' ? ['magus is not allowed'] : [];
  }
}

class AlwaysTwoProblemsRule implements UnitDefinitionRule {
  public check(): readonly string[] {
    return ['first problem', 'second problem'];
  }
}

describe('ContentValidator', () => {
  it('passes when every rule holds for every definition', () => {
    const validator = new ContentValidator([new NoMagusRule()]);
    const catalogue = new ContentCatalogue([LEGEND_CLASSES.get('warrior')]);

    expect(() => {
      validator.validate(catalogue);
    }).not.toThrow();
  });

  it('reports every broken rule at once, prefixed with the definition id', () => {
    const validator = new ContentValidator([new NoMagusRule(), new AlwaysTwoProblemsRule()]);
    const catalogue = new ContentCatalogue([LEGEND_CLASSES.get('magus')]);

    expect(() => {
      validator.validate(catalogue);
    }).toThrow(ContentValidationError);
    expect(() => {
      validator.validate(catalogue);
    }).toThrow(
      'Invalid content: magus: magus is not allowed; magus: first problem; magus: second problem',
    );
  });

  it('passes everything when it has no rules', () => {
    expect(() => {
      new ContentValidator([]).validate(LEGEND_CLASSES);
    }).not.toThrow();
  });
});
