import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { BossCombat } from '../components/BossCombat';
import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { CATHEDRAL_BOSS_ABILITIES } from '../content/mobs/cathedralBossAbilities';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import type { Team } from '../teams/teams.types';
import { CathedralBossSystem } from './CathedralBossSystem';

function encounter() {
  const config = createDefaultGameConfig();
  const state = new GameState(config, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(config.tickRate),
  );
  const spawn = (kind: string, definitionId: string, team: Team, x: number) => {
    const entity = factory.create(kind, definitionId, { position: { x, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const boss = spawn('heavy-mob', 'cathedral-boss', 'neutral', 0);
  state.guards.add({
    id: 'cathedral-post',
    homeId: 'cathedral',
    team: 'neutral',
    mobId: boss.definitionId,
    row: 0,
    indexInRow: 0,
    postX: 0,
    postY: 0,
    homeX: 0,
    homeY: 0,
    homeRadius: 0,
    leashRadius: 25,
    leashTolerance: 0,
    respawnTicks: 0,
    canLevel: false,
  });
  state.guards.fill(0, boss.id);
  const target = spawn('light-mob', 'training-dummy', 'light', 6.4);
  const bystander = spawn('light-mob', 'training-dummy', 'neutral', 5);
  const outside = spawn('light-mob', 'training-dummy', 'light', 26);
  const outsideHealth = outside.getComponent(Health);
  outsideHealth.addShield(outside.id, 5000);
  const shield = 5000;
  target.getComponent(Health).addShield(target.id, shield);
  boss.getComponent(Combat).setTarget(target.id);
  const system = new CathedralBossSystem(
    new DamagePipeline(),
    new StatusEffectApplier(loadStatusEffects(config.tickRate, 2)),
  );
  const logger = new NullLogger();
  const hits: string[] = [];
  let wasPulled = false;
  state.events.on('damage-applied', ({ source }) => {
    hits.push(source.definitionId);
  });
  // Give the defensive move melee proximity while keeping other actions in range.
  for (let tick = 0; tick < config.tickRate * 35; tick += 1) {
    const cycle = boss.findComponent(BossCombat);
    system.update({ state, logger });
    if (cycle?.cast?.id === 'gravity-collapse' && state.tick === cycle.cast.fire) {
      wasPulled = target.getComponent(Transform).position.x < 6.4;
    }
    if (cycle?.cast?.id === 'obsidian-bulwark' && state.tick === cycle.cast.fire) {
      expect(boss.getComponent(Health).shields).toHaveLength(1);
      expect(boss.getComponent(StatusEffects).has('cannot-move')).toBe(true);
      expect(boss.getComponent(StatusEffects).has('cannot-attack')).toBe(true);
    }
    state.advanceTick();
  }
  return { state, hits, boss, target, bystander, outsideHealth, wasPulled };
}

describe('CathedralBossSystem', () => {
  it('selects all five specials without repeats, affects enemies, and replays deterministically', () => {
    const { state, hits, boss, target, bystander, outsideHealth, wasPulled } = encounter();
    expect(hits.toSorted()).toEqual(
      CATHEDRAL_BOSS_ABILITIES.filter(({ damage }) => damage > 0)
        .map(({ id }) => id)
        .toSorted(),
    );
    expect(boss.getComponent(Health).shields).toEqual([]);
    expect(boss.getComponent(StatusEffects).has('cannot-move')).toBe(false);
    expect(target.getComponent(StatusEffects).has('cannot-move')).toBe(true);
    expect(wasPulled).toBe(true);
    expect(bystander.getComponent(Health).current).toBe(bystander.getComponent(Health).max);
    expect(outsideHealth.shields[0]?.current).toBe(5000);
    const hasher = new StateHasher();
    expect(hasher.hash(state)).toBe(hasher.hash(encounter().state));
  });
});
