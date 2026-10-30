import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from '../content/ContentCatalogue';
import { LIGHT_MINION } from '../content/mobs/lightMinion';
import type { UnitDefinition } from '../content/units/units.types';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { ControllerBinding } from './ControllerBinding';

const factory = new EntityFactory(
  createDefaultEntityRegistry(),
  new ContentCatalogue<UnitDefinition>([
    LIGHT_MINION,
    { ...LIGHT_MINION, id: 'bot', controller: 'minion' },
    { ...LIGHT_MINION, id: 'tuned', controller: 'minion', aiProfile: 'lane-minion' },
  ]),
);
const make = (definitionId: string) =>
  factory.create('light-mob', definitionId, { team: 'light', position: { x: 0, y: 0 } });

describe('ControllerBinding', () => {
  it('is installed from the definition, with the controller as the default profile', () => {
    expect(make('light-minion').findComponent(ControllerBinding)).toBeUndefined();
    expect(make('bot').getComponent(ControllerBinding)).toEqual({
      controllerId: 'minion',
      profileId: 'minion',
    });
    expect(make('tuned').getComponent(ControllerBinding).profileId).toBe('lane-minion');
  });
});
