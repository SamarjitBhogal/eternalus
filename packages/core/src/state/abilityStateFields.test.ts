import { describe, expect, it } from 'vitest';
import { starterArena } from '../abilities/__fixtures__/starterArena';
import { AbilityLifetime } from '../components/AbilityLifetime';
import { Abilities } from '../components/Abilities';
import { BeamChannel } from '../components/BeamChannel';
import { BladeFlight } from '../components/BladeFlight';
import { Channeling } from '../components/Channeling';
import { HealingField } from '../components/HealingField';
import { Transform } from '../components/Transform';
import { UltimateLedger } from '../components/UltimateLedger';
import { ZoneArea } from '../components/ZoneArea';
import { abilityStateFields } from './abilityStateFields';
import { StateHasher } from './StateHasher';

describe('persistent ability state hashing', () => {
  it('hashes lifetime, geometry, motion, healing, cadence, channel links, charge timers and form size', () => {
    const a = starterArena();
    const hero = a.spawn('warrior', { position: { x: 50, y: 50 }, team: 'light' });
    const hasher = new StateHasher();
    let previous = hasher.hash(a.state);
    const assertChanged = () => {
      const next = hasher.hash(a.state);
      expect(next).not.toBe(previous);
      previous = next;
    };
    const life = new AbilityLifetime(hero.id, 'test-field', 100);
    hero.addComponent(life);
    assertChanged();
    life.expiresTick++;
    assertChanged();
    hero.addComponent(
      new ZoneArea([
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
      ]),
    );
    assertChanged();
    const blade = new BladeFlight({ x: 1, y: 0 }, 12, 0.8, 80, ['bleed']);
    hero.addComponent(blade);
    assertChanged();
    blade.remaining--;
    assertChanged();
    hero.addComponent(new HealingField(0.001));
    assertChanged();
    const beam = new BeamChannel({ x: 1, y: 0 }, 30, 1.5, 150, 15, 240, 0);
    hero.addComponent(beam);
    assertChanged();
    beam.nextPulseTick++;
    assertChanged();
    hero.addComponent(new Channeling('field-1'));
    assertChanged();
    const ledger = new UltimateLedger();
    hero.addComponent(ledger);
    expect(hasher.hash(a.state)).toBe(previous);
    ledger.hits.set('target', 5);
    assertChanged();
    const slot = hero.getComponent(Abilities).slot('ability-4');
    if (slot === undefined) throw new Error('No ultimate');
    slot.meterLockedUntilTick = 300;
    assertChanged();
    slot.recastUntilTick = 240;
    assertChanged();
    slot.nextRecastTick = 30;
    assertChanged();
    hero.getComponent(Transform).setSizeMultiplier(1.3);
    assertChanged();
  });

  it('canonicalizes contribution insertion order and prunes only stale hits', () => {
    const a = starterArena();
    const hero = a.spawn('warrior', { position: { x: 50, y: 50 }, team: 'light' });
    const ledger = new UltimateLedger();
    hero.addComponent(ledger);
    ledger.hits.set('b', 2);
    ledger.hits.set('a', 1);
    const before = abilityStateFields(hero);
    ledger.hits.clear();
    ledger.hits.set('a', 1);
    ledger.hits.set('b', 2);
    expect(abilityStateFields(hero)).toEqual(before);
    ledger.prune(12, 10);
    expect([...ledger.hits]).toEqual([['b', 2]]);
  });

  it('repeats a mixed persistent-effect command sequence with the same hash', () => {
    const play = () => {
      const a = starterArena(19);
      const warrior = a.spawn('warrior', { position: { x: 30, y: 50 }, team: 'light' });
      const magus = a.spawn('magus', { position: { x: 40, y: 50 }, team: 'dark' });
      a.cast(warrior.id, 'ability-3');
      a.cast(magus.id, 'ability-2');
      a.run(20);
      a.charge(magus.id);
      a.cast(magus.id, 'ability-4', { x: 10, y: 50 });
      a.run(30);
      return new StateHasher().hash(a.state);
    };
    expect(play()).toBe(play());
  });
});
