---
title: Requirements of architecture (source transcription)
description: Verbatim transcription of the product owner's requirements document ("the bible"); read it when you need the original wording behind a requirement in 06-mvp-requirements.md.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [requirements, source, transcription]
related:
  ['docs/requirements/06-mvp-requirements.md', 'docs/reference/source/game-project-eternalus-v2.md']
---

# Requirements of architecture (source transcription)

Purpose: Read this when you need the product owner's original words behind a requirement, or when
a catalogue entry in [`06-mvp-requirements.md`](../06-mvp-requirements.md) cites `Req: <section>`.
This file is the **verbatim source**: order and wording are preserved, and only obvious typos are
corrected in square brackets (for example "amything [anything]"). Do not edit the content; changes
to what the project requires go through an ADR and the normalised catalogue. The section headings
below are the document's own lead-in lines, kept as headings so they can be cited.

> **Normalised catalogue.** [`06-mvp-requirements.md`](../06-mvp-requirements.md) is the FR-/NFR-
> catalogue derived from this document and from the game design document
> ([`../../reference/source/game-project-eternalus-v2.md`](../../reference/source/game-project-eternalus-v2.md)).
> Where this document and the writer brief disagreed (for example TypeScript scope, the "neutral
> entity" branch, the word "hoard"), the product owner's decisions are recorded in
> `docs/decisions/` and the catalogue follows them; this transcription keeps the original text.

## Requirements of architecture

We are only permitted JavaScript, HTML, and CSS for the MVP.

TypeScript is allowed only where it is needed for OOP if JavaScript cannot do it cleanly and would
cause issues/bulk

No game engine allowed for MVP

OOP, SOLID, DRY, Patterns always. NO AI SLOP MONOLITHS. SENIOR ENGINEER LEVEL CODING. NO
SHORTCUTS. NO TIGHT COUPLING. NO HARDCODING. NO MAGIC NUMBERS.

### avoid anything hardcoded as much as possible

e.g.,

- MVP has three lanes with 1 spawner tower and 1 buff tower per lane
- i should be able to change 3 values in a config file (NUM_LANES, NUM_SPAWN_TOWERS,
  NUM_BUFF_TOWERS) and the map would adjust accordingly

SOLID and DRY are a bible

use patterns (factories, fascade [facade], etc.) wherever possible

### inheritance

- e.g.,
- Entity class
  - User character inherits (generic user class entity)
    - user subclass assault
    - user subclass sentinel
    - user subclass magus
    - user subclass arial [aerial]
  - mobs inherit (generic mob class entity)
    - mob class heavy
    - mob class medium
    - mob class light
  - neutral entity inherit (generic neutral entity class entity)
    - light camp
    - medium camp
    - heavy camp
    - boss entity (generic boss neutral class entity)
      - mini boss
      - greater boss

### project is very early stages

project is very early stages. if i wanted to change the name of "Assault" to amything [anything]
else at any time, should be very easy (just change class name, then change the import statements
and the header of whatever inherited from formerly-known-as-Assault)

### heavy use of AI agents for coding

heavy use of AI agents for coding

must use a harness

- deep research on how to set up an appropriate harness for this project

Claude Code as a primary agent for some members, others use ChatGPT or Gemini

- CLAUDE.md files for claude users
- other, analagous [analogous] types of files for other LLMs

### dynamic map/minimap generation

- minimap should reflect the map changes with no code change needed
- if map adds an obstacle, minimap shows it without changing code
- new building on map = new building on minimap, no code change needed

### easy changes in menu settings

- e.g., user wants to change their key bindings from wasd movement to arrow keys. they press enter
  on "w", press <up arrow> on their keyboard, then press enter to save. done.
- want to change their first gadget spot from "z" to button on the side of their mouse. simple
  click and change in settings. done.
- any prompts that show up throughout game play (e.g., tutorials) change dynamically to reflect
  whatever keybindings they chose. no work needed from anyone.

### adding abilities, changing abilities, adding weapons

adding abilities, changing abilities, adding weapons, adding restrictions to abilities, weapons,
etc should all be extremely simple in code. NOTHING HARDCODED

### should be able to enable/disable developer menu in-game

- add/remove legends (max 10)
- spawn mobs from different origin points (max 144 units per team; shouldnt crash. Total War games
  can thousands, LoTR BFME mods can do thousands, no reason we cant do ~1.5 hundred if we engineer
  properly; should be able to support hundreds per team but keep low for MVP)
- sim game (remove/add user controlled Legend)

### Testing is extremely important

Testing is extremely important; not just when developing, but while the game is running.

If tests dont actually connect, they dont really exist.

An ongoing game should have constant monitoring and logging of issues.

- If an entity passes through an unbreakable object, log it
- if an entiry [entity] passes through an unbroken wall or object, log it
- if something despawns without something else removing it, log it
- if an entity dies without another entity or a defensive tower killing it, log it
- etc

### MVP

- 3 lanes
- 1 set of spawner towers per team (1 per lane)
- 1 set of buff/debuff towers (also spawners) per team (1 per lane)
- wall around stronghold per team
- stronghold per team
- 10 v 10 Legends (word i am now using for the user characters), all bots except 1 user controlled
  character
- 2 teams (light, dark); Allied team, Enemy team, neutral camps/bosses/mini-bosses (randomly
  chosen for player)
- minion hoards [sic; "hordes" in our docs] (needs a better name) of 16 units (for light hoards),
  8 units (for medium hoards), and 4 units (for heavy units)
- minions spawn from towers every 1 minute with 48 units spawning at match start from the
  stronghold (3 hoards, 1 in each lane)
- 1 minute countdown from match initiation (nothing spawns from towers, only the 3 hoards spawn
  from stronghold until the 1 minute timer expires)
- 3 central capture points (1 per lane, reference the document on what they entail)
- 6 forest camps per team side (placed between the lanes (e.g., 1 lane -> 3 camps -> middle lane
  -> 3 camps -> 1 lane)) (camps also dont spawn units until after the cooldown (see next point))
- top down, wasd default movement, 1,2,3,4 for abilites [abilities] with 4 being ultimate, z and c
  for gadgets, no hard-coded controls, configurable controls via settings
- map + minimap
- JavaScript, TypeScript, CSS, HTML ONLY!!! See the current repo for details
- 3 classes
- simple XP-based scaling on abilities (blessings?), health, and aether (equivalent to mana;
  currency for ability use after cooldown is done)
- simple loadout options (weapons, some ability options, etc)
- AI-controlled hoards, AI controlled non-player units
- Neutral camps
- simple loading screen
- simple game boot menu with options for:
  - start match
  - loadouts
    - can configure loadouts that are saved to the users profile
  - profile (better, themed name needed)
    - match history (match id, character scores, acheivements [achievements]/medals
      (acheivements [achievements] currently dont exist; should be an easy add),
  - settings
  - about/credits

### Long term goal

- first person view with 3rd person option in settings (view switching bindable to hotkeys)
- added console controller key configs
- full ability levelling (ability upgrade tree still undecided)
- game engine use (Unity / Unreal Engine / etc) for dev
- added arial [aerial] class (needs a new name)
- Everything in the refernce [reference] document + much more.

### The goal of telling you the MVP vs the full game

The goal of telling you the MVP vs the full game is that, as defined above many times, everything
should be so well engineered and structured and planned that moving to a totall [totally] new
system shouldnt be incredibly difficult. We build in excess with perfect engineering, OOP
Principles, SOLID, DRY code, OOP patterns, etc. now, so that when the project is done for this
class and we are free to move to a real engine, we already have a lot of stuff to use and we dont
have to start from scratch. we will need to change langiages [languages] and move to a real engine
(no html, css, javascript in the real game), but the logic and structure is so perfectly executed
that we are essentially translating to a new surface rather than restarting from 0.

Our OOP, SOLID, DRY, Pattern usage should be so incredibly well done that adding in totally new
features (e.g., mounts, form changes, etc.) should be as simple as adding a new programming class
and adding that to the game. We really want this dev process to be as easy as "new idea? add a new
class!" so that these early stages are like building a custom lego set: just add another block.

this is for a software engineering course. we must be diligent and follow best practices and
organization as much as possible

### WHAT I NEED FROM YOU

- I need you to review the game doc, review the existing repo, and create a plan document for how
  we will build this
- I need:
  - A new (or added on to existing) documentation folder containing:
    - 1 Plan document folder
      - plan phases; clear, distinct, checklisted, with tests and success metrics
      - 1 document per phase, divided into sprints
    - 1 Architecture document folder
      - contains separated architecture themes on how to structure the platform
        - e.g.,
          - Entity class and children architecture
          - Map and minimap architecture
          - Buildings, obstacles, breakable environment architecture
          - code structure
        - Organize these sub-files/sub-folders in whichever way makes the most sense and is the
          most organized for humans and agents to read through
      - agentic harness description
      - database configuration (Single Access with a Controller in front)
        - Persistent storage
        - Game resources
      - Game "engine"
      - hardware abstraction
      - Game physics
      - Game AI
      - Game Story
      - Game interface
      - Game Model
      - Layered, OOP Architecture model
    - 1 folder for the reference file(s) containing
      - the reference/guide document split into markdown files, organized according to the
        specific focus of their content
        - e.g.,
          - reference for details about entities (Legends, mobs, etc)
          - reference for weapons
          - reference for abilities
          - reference for map, buildings, environment, etc
          - reference for lore
          - etc.
      - A folder for suggestions:
        - balancing
        - more abilities
          - themed names
          - more weapons
          - naming (classes, minions, hoards, subclasses, bosses, structures, etc)
          - patching discrepancies
          - etc.
    - 1 folder for requirements including, but not limited to:
      - architecture principles
      - coding principles
      - organization guidelines
      - agentic instructions
      - engineering and senior engineering requirements
      - etc
    - 1 folder for research:
      - deep resaerch [research] done
      - work cited
      - etc.
  - An agentic harness scaffold for those of us who use Claude Code, and agent-agnostic document
    set to go along with it
- Organize these sub-files/sub-folders in whichever way makes the most sense and is the most
  organized for humans and agents to read through.
  - Use YAML, Markdown, or whatever type of frontmatter makes it easiest for a task-focussed agent
    to get to their specific instruction/reference documents

If you think my structure is chaotic and you can do better, tell me, and we will make decisions
together about how we move forward. We will work as a team on this. I have the vision and know
what i want the game to be one day. You are the coding expert and are better at programming than
i could ever be. We will be an incredible team together.

## Related

- [`../06-mvp-requirements.md`](../06-mvp-requirements.md): the normalised FR-/NFR- catalogue derived from this text
- [`../README.md`](../README.md): what the requirements folder is and how it ranks against ADRs and conventions
- [`../../reference/source/game-project-eternalus-v2.md`](../../reference/source/game-project-eternalus-v2.md): the game design document, the other source of the catalogue
- [`../../decisions/`](../../decisions/): product owner decisions that resolve contradictions with this text
