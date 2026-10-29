---
title: Naming suggestions
description: Themed name proposals for every placeholder in the game doc and the requirements doc, plus the in-code naming convention that keeps renames cheap.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-28
tags: [reference, suggestions, naming, content]
paths: ['packages/core/src/content/**']
related:
  - 'docs/reference/game-design/12-open-questions.md'
  - 'docs/reference/glossary.md'
  - 'docs/architecture/17-extension-recipes.md'
---

# Naming suggestions

**Purpose.** Read this when a placeholder name ("rename pending", "name pending", "needs a themed name") has to become a real display name, or when you need to know how a rename is done in code without touching content IDs or save data. Every name below is a proposal for the product owner; the recommended pick is only the author's first choice. Tone target: grand dark fantasy (Remnant 2, Battle for Middle-earth, Elden Ring, Lords of the Fallen); the Light team is a gold-white-blue paladin order, the Dark team is red-black-purple lava and rock, and the lore's third "Medium" faction favours chaos and self-rule.

Conventions used here: **Recommended** = the author's pick; every option carries a one-line meaning or reason; the placeholder in code stays exactly as it is today (see "In-code naming convention"). Status of every item: proposed. MVP status is given per item.

## Classes

### Warrior (formerly Assault) — MVP

**Decided (DEC-48).** The display name is content: `displayName` in `packages/core/src/content/legends/warrior.ts`. The options below are kept as the record of the proposal.

The class is lighter, lower health, faster, with light weapons and damage split between magic and physical. Its sub-classes are Assassin, Knight and Paladin, so the class name has to sit above a stealthy, a balanced and a sustained fighter without being any one of them.

| Option       | Why                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Vanguard** | The ones who go in first; reads as a skirmisher on both teams; sits naturally above Assassin/Knight/Paladin. Recommended. |
| Striker      | Plain and descriptive; leans toward burst damage and away from the Paladin sub-class                                      |
| Duelist      | Emphasises single-combat skill and the short blades; slightly too civilised for the Dark team                             |
| Reaver       | Grim and fast; strongly Dark-coded, which weakens it for the paladin order                                                |
| Warden       | Neutral and orderly (both factions "favoured order"), but it suggests defence rather than attack                          |
| Champion     | Fits the lore of orderly factions sending champions, but it is also what MOBAs call every player character                |

### Flying — post-MVP

**Decided (DEC-48).** The display name is content: `displayName` in `packages/core/src/content/legends/locked/flying.ts`. The class stays post-MVP. The options below are kept as the record of the proposal.

Air-based, moves like a jet or helicopter, ability damage and range, can melee at a risk. Sub-classes Hover and Strafe.

| Option      | Why                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| **Harrier** | A bird of prey and a military verb (to harass from the air); works for gold-winged and bat-winged skins. Recommended. |
| Skyborne    | Descriptive, faction-neutral, slightly generic                                                                        |
| Zephyr      | Wind spirit; elegant, better for the Light palette than the Dark one                                                  |
| Valkyr      | Chooser of the slain; strong image, but gendered and heavily used elsewhere                                           |
| Corsair     | Aerial raider; fits Strafe better than Hover                                                                          |

## Sub-classes (decided, DEC-49; MVP since DEC-56)

The owner decided the sub-class titles and Legend names (DEC-49); they are content in `packages/core/src/content/legends/specs/`, and sub-classes are MVP (DEC-56). The proposals below are kept as the record. The game doc labels all sub-class names as pending, so every row has options; the working name is listed first. Sentinel's second sub-class has no working name or focus yet, so its row proposes both.

| Class    | Working name | Focus (from the game doc)                                          | Recommended     | Alternates                                                | Why                                                                                                                       |
| -------- | ------------ | ------------------------------------------------------------------ | --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Warrior  | Assassin     | Lighter, higher burst                                              | **Shade**       | Wraith, Nightblade, Cutthroat                             | One word, stealth-coded, pairs with the Veil ability                                                                      |
| Warrior  | Knight       | Balanced weight and damage                                         | **Blade**       | Duelist, Sellsword, Lancer                                | The balanced fighter defined by its weapon, not its armour; avoids "Knight" (too Light-coded)                             |
| Warrior  | Paladin      | Heavier, higher sustain                                            | **Templar**     | Zealot, Crusader, Justicar                                | Keeps the holy-warrior flavour without borrowing the Light team's own art descriptor ("paladin armour")                   |
| Sentinel | Colossus     | Melee focus, extra resistance                                      | **Colossus**    | Bulwark, Goliath, Juggernaut                              | Keep: already thematic and it names the size fantasy (a 15 ft Sentinel)                                                   |
| Sentinel | (TBD)        | (TBD) — proposal: siege focus, mortar and structure damage, slower | **Breaker**     | Warden (control focus), Bastion (support focus), Ironclad | Gives the tank line a damage/balance/support split: Colossus (balance), Breaker (damage vs structures), Bastion (support) |
| Magus    | Necromancer  | Debuff focus; revives fallen entities                              | **Necromancer** | Revenant, Gravecaller, Lich                               | Keep: the Necromancy passive already exists and the name is instantly understood                                          |
| Magus    | Druid        | Buff focus                                                         | **Hierophant**  | Oracle, Cleric, Warden                                    | "Druid" reads as nature magic, which neither faction has; a hierophant is a keeper of rites (buffs)                       |
| Magus    | Mage         | Self focus                                                         | **Evoker**      | Arcanist, Sorcerer, Invoker                               | "Mage" is already the shorthand for the whole Magus class; a sub-class needs a distinct word                              |
| Flying   | Hover        | Better health, sustain, slower                                     | **Roc**         | Gryphon, Wyvern, Warhawk                                  | The giant bird: heavy, enduring                                                                                           |
| Flying   | Strafe       | Lower health, burst, faster                                        | **Kestrel**     | Shrike, Swift, Falcon                                     | Small, fast, hovers then strikes                                                                                          |

Open question carried from the game doc: should sub-classes follow a generic damage / balance / support split? The Sentinel proposal above assumes yes (Colossus / Breaker / Bastion), which also makes the `LegendSpecDefinition` data shape uniform: `role: 'damage' | 'balance' | 'support'`.

## Forms

### Enchantment (rename pending) — post-MVP (form change is YELLOW/TEAL)

The support form, paired with Ascendance (attack) and Eternal (the greater base class).

| Option          | Why                                                                                     |
| --------------- | --------------------------------------------------------------------------------------- |
| **Benediction** | A blessing spoken over others; parallels "Ascendance" as an abstract noun. Recommended. |
| Communion       | Sharing power with allies; slightly religious in a way that fits both orderly factions  |
| Consecration    | Sanctifying the ground or the body; suits an aura-based support form                    |
| Aegis           | Shield of the gods; better if the support form is protective rather than empowering     |
| Sanctum         | Suggests a place rather than a state; weakest of the set                                |

Recommendation for status-effect IDs (see `more-abilities.md`): the minion buff for killing a Legend keeps the ID `ascended`; the final-hit reward form on a Legend uses the ID `eternal`; the post-MVP attack form uses `ascendance`. Three distinct IDs stop the three "ascend" meanings in the game doc from colliding in code.

## Hordes and minions — MVP

### Group noun ("hoard" in the source docs)

Our docs already say **horde** (the correct spelling of what the requirements doc means). The owner asked for a better name; the options below are display names. The code aggregate stays `Horde` / `HordeSystem` whatever is chosen.

| Option                      | Why                                                                                                                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Horde** + tier names      | Keep "horde" as the generic term and give the three sizes their own display names: **Swarm** (light, 16), **Warband** (medium, 8), **Cohort** (heavy, 4). The announcer can say "a heavy cohort marches on the north lane". Recommended. |
| Warband                     | Single faction-neutral group noun; sounds like a raiding party, which fits 8 more than 16                                                                                                                                                |
| Host                        | Archaic army ("the heavenly host"); very Light-coded                                                                                                                                                                                     |
| Legion                      | Orderly and large; too grand for 16 units, better as the name of the whole lane army                                                                                                                                                     |
| Cohort                      | Roman sub-unit; precise, a little dry                                                                                                                                                                                                    |
| Throng, Tide                | Evocative but hard to use in UI strings ("a throng approaches")                                                                                                                                                                          |
| Host (Light) / Horde (Dark) | Faction-flavoured pair; strong tone, but two words for one concept costs glossary clarity and doubles every UI string. Option only.                                                                                                      |

### Minion tiers (light / medium / heavy)

"Minion" stays the display word for lane units (the code family is `Mob`; see `discrepancies.md` DISC-07). Tier display names live in `content/mobs/`.

| Tier   | Recommended    | Alternates                 | Why                                                                           |
| ------ | -------------- | -------------------------- | ----------------------------------------------------------------------------- |
| Light  | **Skirmisher** | Levy, Thrall, Scout        | Fast, numerous, expendable                                                    |
| Medium | **Footman**    | Man-at-Arms, Warden, Guard | The line infantry; also the guard type at BuffTowers                          |
| Heavy  | **Goliath**    | Brute, Ogre, Juggernaut    | Big and slow; "Goliath" reads on both a golem (Light) and a hell-brute (Dark) |

Option: per-team skin names on top of the tier (Light: Acolyte / Templar / Colossal; Dark: Imp / Hellguard / Behemoth) through an optional `displayNameByTeam` field (see the convention section). Recommendation: do not do this for the MVP; one name per tier keeps the HUD, the glossary and the tests simple.

The "one massive assist mob (Balrog-type)" at capture checkpoint 3 needs a name too: **Behemoth** (alternates: Ravager, Warden of the Point, Rift-born). It is a `HeavyMob` variant in content, not a boss.

## Structures — MVP

### Buff/debuff towers ("need a themed name")

Second-line towers: team-wide buffs, debuff aura, shields for other structures, spawn light and medium hordes, guarded by medium mobs.

| Option        | Why                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ward**      | "Ward" means both protection (the buff and the shield bars) and warding off (the debuff aura). Short enough for the HUD ("north Ward down"). Recommended. |
| Obelisk       | A monolith radiating power; visually strong for both palettes                                                                                             |
| Shrine        | A holy site; fits the paladin order, slightly less the hellish one                                                                                        |
| Beacon / Pyre | A faction pair (gold beacon, red pyre); same cost as any two-name option (see hordes)                                                                     |
| Spire         | Tall and magical; generic                                                                                                                                 |

Code identifier stays `BuffTower`; content ID stays `buff-tower`.

### Spawner towers

Front-line towers that spawn light hordes and keep light guards.

| Option       | Why                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------ |
| **Garrison** | A place where troops are kept and sent out; says "spawner" without saying it. Recommended. |
| Barracks     | The Battle for Middle-earth word; familiar to the reference audience                       |
| Muster       | Where an army gathers; unusual as a building name, memorable                               |
| Warcamp      | Fits the Dark side better than the Light side                                              |
| Watchtower   | Says "tower" but not "spawner"                                                             |

Code identifier stays `SpawnerTower`; content ID `spawner-tower`.

### The "summoner" held by the capital (to be defined)

The game doc says the capital "holds the summoner (to be defined)". `mechanics-ideas.md` proposes its minimal meaning (the Stronghold's `Spawner` component: the source of the three opening hordes and later heavy reinforcements). Its display name:

| Option         | Why                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| **Wellspring** | The source the hordes pour from; also a natural place to put aether/blessing upgrades later. Recommended. |
| Altar          | Where the faction's power is invoked; ties to Fury's god                                                  |
| Font           | Short, sacral (a baptismal font), slightly obscure                                                        |
| Conclave       | A council chamber; fits "orderly factions" but not "spawns hordes"                                        |

### The Cathedral gem

Spawns in the centre Cathedral, glows, explodes mid-game to summon the Eternal.

| Option               | Why                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Godseed**          | A seed that hatches a god: says exactly what the gem does when it "explodes". Recommended. |
| Eternal Shard        | Names the thing it summons; safest for the glossary                                        |
| Heartgem             | The heart of the Cathedral; warmer, less ominous                                           |
| Ember of the Eternal | Fits the Dark palette; long for a HUD label                                                |
| Sunstone             | Light-coded; wrong for a neutral object                                                    |

## Abilities, passives and gods

### "Studious" (Magus passive; name pending) — MVP

Abilities last X% longer and are N% more potent; the ultimate fills faster.

| Option         | Why                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------ |
| **Erudition**  | A single noun like the other Magus passive, Necromancy; scholarship as power. Recommended. |
| Attunement     | Being in tune with aether; explains the faster ultimate                                    |
| Deep Lore      | Two words, evocative, slightly informal                                                    |
| Litany         | A long recited prayer: "abilities last longer"                                             |
| Scholar's Mind | Descriptive; reads like a card game keyword                                                |

### "Death Ray" (Magus ultimate; working title) — MVP

A very long beam that lasts N seconds; two opposing beams lock together and extend both ultimates.

| Option        | Why                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Judgement** | Both factions are "holier-than-thou" and "no faction is innocent": each side passes judgement on the other. "Two Judgements lock together" reads well. Recommended. |
| Unmaking      | Ominous and faction-neutral; suits the beam's finality                                                                                                              |
| Requiem       | A mass for the dead; strong Necromancer flavour, less so for a Hierophant                                                                                           |
| Sunlance      | Beautiful for the Light palette, wrong for the Dark one                                                                                                             |
| Annihilation  | Plain; the safe fallback                                                                                                                                            |
| Final Verse   | Poetic; pairs with Litany/Erudition if those are picked                                                                                                             |

### The god invoked by Fury (Warrior ultimate) — MVP

"Imbue yourself with the light of [god name]." Both teams use the same Fury, so the god must be one both factions could invoke; in the lore they once shared one realm.

| Option      | Why                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Aethon**  | "Burning" (Greek); the name shares its root with **aether**, the game's mana, which quietly explains what aether is. Recommended. |
| the Eternal | Ties the ultimate to the central boss and the game title; risk: "Eternal" already names the boss and the final-hit form           |
| Vaerith     | Invented; sounds like a war god; no baggage                                                                                       |
| Solmund     | "Sun-protector" (Norse roots); Light-coded                                                                                        |
| Ithra       | Short, ambiguous gender and faction                                                                                               |
| Kharos      | Harsh consonants; Dark-coded                                                                                                      |

The Dark team's Fury line can invoke the same god with different words ("the fire of Aethon"); the line is a content string per team, not a second god.

## Weapons and artifacts

### The unnamed bow — MVP

Obsidian bow, glowing purple arrows with black smoke trails, reduces protections (stacks).

| Option      | Why                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| **Ashveil** | The smoke trail is a veil of ash; "veil" also hints that it strips (unveils) protection. Recommended. |
| Duskfang    | Predatory; matches Raptor Talons' naming style                                                        |
| Sunderer    | Names the effect (sunders armour); plain                                                              |
| Nightshard  | Obsidian is a black glass; literal                                                                    |
| Gloamstring | Twilight bow; pretty, hard to say                                                                     |

### The second Tank artifact (TBD) — MVP

`more-weapons.md` proposes what it does; the name options match that proposal (a rallying or challenging horn).

| Option        | Why                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------- |
| **Warhorn**   | Blown by the biggest soldier; two varieties (Rally / Challenge) map to two horn calls. Recommended. |
| Bulwark Totem | A planted shield-wall; overlaps the proposed Shield Wall ability                                    |
| Grapnel Chain | A pull artifact; fun, but a third Grab-like interaction                                             |
| War Banner    | Planted buff aura; Battle for Middle-earth flavour                                                  |

## Screens and systems

### Profile screen ("better, themed name needed") — MVP

Holds match history, character scores, achievements.

| Option        | Why                                                                                     |
| ------------- | --------------------------------------------------------------------------------------- |
| **Chronicle** | A record of deeds in order; "Your Chronicle" needs no explanation. Recommended.         |
| Annals        | Yearly records; more archival, less personal                                            |
| Codex         | A bound book of knowledge; would suit an encyclopedia screen better                     |
| Saga          | A hero's story; good, slightly Norse                                                    |
| Reliquary     | A container of relics; better as the name of the loadout screen (weapons and artifacts) |

Bonus (outside the asked list): loadout screen = **Reliquary** or **Armoury**; settings stays Settings; about/credits = **Scribes**.

### Achievements / medals system name — MVP-if-time

| Option    | Why                                                                                 |
| --------- | ----------------------------------------------------------------------------------- |
| **Deeds** | "Deeds of Legend"; each medal tier is a **Mark** (iron, silver, gold). Recommended. |
| Laurels   | Victory wreaths; classical                                                          |
| Honours   | Formal; British spelling consistent with the docs                                   |
| Accolades | Knighthood ceremony; a bit long for a tab                                           |
| Feats     | Plain; collides with the `feat/` branch prefix in conversation                      |

### Developer menu — MVP

| Option                | Why                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| **Architect's Table** | The owner is the lead architect; the table where the map and its armies are laid out. Recommended. |
| Forge                 | Where things are made; likely wanted later for a crafting or loadout feature                       |
| Loom                  | Weaving the match; abstract                                                                        |
| Warroom               | Military planning room; plain                                                                      |
| Scriptorium           | Where scripts are written; a joke for the programmers                                              |

Code identifier stays `DeveloperMenu` (`apps/client/src/ui/hud/DeveloperMenu`).

## Summary table

| Placeholder (today)               | Recommended pick                           | Alternates                                     | MVP status  |
| --------------------------------- | ------------------------------------------ | ---------------------------------------------- | ----------- |
| Warrior (class)                   | decided (DEC-48), in content               | Striker, Duelist, Reaver, Warden, Champion     | MVP         |
| Flying (class)                    | decided (DEC-48), in content               | Skyborne, Zephyr, Valkyr, Corsair              | post-MVP    |
| Warrior / Assassin                | Shade                                      | Wraith, Nightblade, Cutthroat                  | post-MVP    |
| Warrior / Knight                  | Blade                                      | Duelist, Sellsword, Lancer                     | post-MVP    |
| Warrior / Paladin                 | Templar                                    | Zealot, Crusader, Justicar                     | post-MVP    |
| Sentinel / Colossus               | Colossus (keep)                            | Bulwark, Goliath, Juggernaut                   | post-MVP    |
| Sentinel / second sub-class (TBD) | Breaker (siege focus)                      | Warden, Bastion, Ironclad                      | post-MVP    |
| Magus / Necromancer               | Necromancer (keep)                         | Revenant, Gravecaller, Lich                    | post-MVP    |
| Magus / Druid                     | Hierophant                                 | Oracle, Cleric, Warden                         | post-MVP    |
| Magus / Mage                      | Evoker                                     | Arcanist, Sorcerer, Invoker                    | post-MVP    |
| Flying / Hover                    | Roc                                        | Gryphon, Wyvern, Warhawk                       | post-MVP    |
| Flying / Strafe                   | Kestrel                                    | Shrike, Swift, Falcon                          | post-MVP    |
| Enchantment (form)                | Benediction                                | Communion, Consecration, Aegis, Sanctum        | post-MVP    |
| "hoard" (group noun)              | Horde, with tiers Swarm / Warband / Cohort | Warband, Host, Legion, Cohort, Host/Horde pair | MVP         |
| Minion tiers                      | Skirmisher / Footman / Goliath             | Levy, Thrall; Man-at-Arms, Warden; Brute, Ogre | MVP         |
| Checkpoint-3 massive mob          | Behemoth                                   | Ravager, Warden of the Point, Rift-born        | MVP         |
| Buff/debuff tower                 | Ward                                       | Obelisk, Shrine, Beacon/Pyre, Spire            | MVP         |
| Spawner tower                     | Garrison                                   | Barracks, Muster, Warcamp, Watchtower          | MVP         |
| Capital's "summoner"              | Wellspring                                 | Altar, Font, Conclave                          | MVP         |
| Cathedral gem                     | Godseed                                    | Eternal Shard, Heartgem, Ember of the Eternal  | MVP         |
| Studious (passive)                | Erudition                                  | Attunement, Deep Lore, Litany, Scholar's Mind  | MVP         |
| Death Ray (ultimate)              | Judgement                                  | Unmaking, Requiem, Sunlance, Annihilation      | MVP         |
| God invoked by Fury               | Aethon                                     | the Eternal, Vaerith, Solmund, Ithra, Kharos   | MVP         |
| Unnamed bow                       | Ashveil                                    | Duskfang, Sunderer, Nightshard, Gloamstring    | MVP         |
| Second Tank artifact              | Warhorn                                    | Bulwark Totem, Grapnel Chain, War Banner       | MVP         |
| Profile screen                    | Chronicle                                  | Annals, Codex, Saga, Reliquary                 | MVP         |
| Achievements / medals             | Deeds (medals: Marks)                      | Laurels, Honours, Accolades, Feats             | MVP-if-time |
| Developer menu                    | Architect's Table                          | Forge, Loom, Warroom, Scriptorium              | MVP         |

Names that are already decided and are not reopened here: Eternal (the central boss; "Titan" is removed), Sentinel, Magus, Legend, Stronghold, Cathedral, aether, Veil, Blade Runner, Fury, Imbue, Shockwave, Nova, Rip & Tear, Slam, Berserk, Meteor Fall, Wrecking Run, Necromancy, Revive, Levitate, Grab, Pick Up, Raptor Talons, A Fine Line, Wuuthrad, Lightbringer, Mortar, Soul Orb (pending).

## In-code naming convention (keeps renames cheap)

The requirements doc wants a rename of "Warrior" to be "just change the class name, then change the import statements and the header of whatever inherited from it". The convention below makes that true, and makes the _display_ rename even cheaper. It serves the Open/Closed and Single Responsibility principles: a name shown to players is data with one place of change (the content definition); a name used by code is a symbol that tooling renames; an identifier stored on disk or in a replay never changes at all.

1. **Display names live in content definitions.** Every definition in `packages/core/src/content/` carries `displayName` (and, only if the owner accepts a faction pair such as Beacon/Pyre, an optional `displayNameByTeam`). The HUD, the loadout screen, the announcer and the Chronicle read `displayName` through the snapshot; no React component or view contains a gameplay name string. Changing "Warrior" to "Vanguard" on screen is a one-line content change and no test that checks behaviour breaks.
2. **Code identifiers use the stable internal name.** The class is `Warrior` (`packages/core/src/entities/Warrior.ts`) until the owner decides otherwise. If the owner does want the class identifier renamed, it is a mechanical rename-symbol in the IDE plus a file rename, exactly what the requirements doc describes. It needs no ADR because no behaviour and no data changes.
3. **kebab-case content IDs never change once a save or a release stores them** (`CONTRIBUTING.md` §2). Once saved loadouts, match history rows or replays store `'warrior'`, it is the content ID of the class for good, even if the class becomes Vanguard: a renamed ID would then need a persistence migration and would silently break replays. Until then, an ID rename is a content refactor whose missed references fail the checks (ADR 0023).
4. **Registries map IDs to classes**, so a class rename touches the one registry line and nothing else (`EntityRegistry`, `AbilityRegistry`, `ViewRegistry`).
5. **Events, commands and status-effect IDs follow the same rule**: kebab-case strings that describe the thing, never the display name (`'buff-tower'`, not `'ward'`).

Sketch (not code that exists):

```ts
// packages/core/src/content/legends/warrior.ts (sketch)
export const ASSAULT_LEGEND = {
  id: 'warrior', // stable content ID: never renamed once a save or a release stores it
  displayName: 'Vanguard', // proposed; change freely, nothing else moves
  displayNameByTeam: undefined, // optional faction pair, e.g. { light: 'Templar', dark: 'Reaver' }
  role: 'balance',
  abilityIds: ['veil', 'blade-runner', 'hamstring'],
  ultimateId: 'fury',
} satisfies LegendDefinition;

// packages/core/src/entities/EntityRegistry.ts (sketch): the only line that knows the class
registry.register('warrior', (definition, ctx) => new Warrior(definition, ctx));
```

Renaming a class identifier, step by step: rename the class symbol and its file (IDE), update the one registry line, run `npm run check`. Content IDs, save data, replays and display names are untouched. `../../architecture/17-extension-recipes.md` has the matching recipes for adding a class, an ability or a structure; a rename is the degenerate case of those recipes where nothing new is added.

## Related

- `README.md` — how a suggestion is accepted
- `../game-design/01-classes-and-subclasses.md` — the classes and sub-classes these names apply to
- `../game-design/03-structures-and-defenses.md` — towers, walls, gates and turrets
- `../game-design/10-art-and-lore.md` — palette and lore the names must fit
- `../game-design/12-open-questions.md` — where the owner's picks are recorded
- `../glossary.md` — canonical vocabulary (update it when a name is accepted)
- `../../architecture/17-extension-recipes.md` — recipes that keep renames and additions cheap
- `more-abilities.md`, `more-weapons.md`, `mechanics-ideas.md` — the things being named
