---
title: Legend sprite provenance
description: Reference mapping, permission confirmation, hashes and packing for five generated character atlases.
audience: [humans, agents]
status: draft
owner: gurshaan
last-reviewed: 2026-11-13
tags: [assets, provenance, legends]
related: [docs/decisions/0027-additional-legend-asset-budget.md]
---

# Legend sprite provenance

Gurshaan supplied these local attachments and confirmed permission to use and adapt all of
these images on 2026-11-12, including the watermarked knight and the credited blue giant reference. This records the user's confirmation, not an independent licence verification or a
claim that the team authored the source artworks. Original download URLs were not supplied. The blue giant itself prints
`www.artstation.com/jsraphael` and the copyright notice "2021 Arackhan Wars, Nothing But
Dreams. All Rights Reserved." These printed credits are preserved in the asset records.
The earlier permission question mistakenly called this a Riot Games reference; the printed
credit above is the attribution used by the project.

The mapping was confirmed by Gurshaan: two swords = Zealot (`assassin`), flaming sword =
Templar (`knight`), white/gold knight = Paladin (`paladin`), white rock giant = Colossus
(`colossus`), larger blue-white rock giant = Bulwark (`juggernaut`). Stable content IDs remain.

Generated with Codex built-in image generation on 2026-11-12, except the Templar and Paladin
candidates generated during the task's initial reference inspection. Each sheet has six columns
and ten rows: idle, south/north/west/east walk, basic attack, three documented class-action
previews and an ultimate preview. Warrior previews: Veil, Blade Runner, Hamstring, Fury.
Sentinel previews: Shield Wall, Sunder, Colossus Roar, Meteor Fall (ground-impact pose).
These are class-pool animations, not invented subclass powers. Sentinel generation briefs used
an Avalanche label for the final ground-impact row; that action matches Meteor Fall in the
reference docs, so the shipped slot uses Meteor Fall and implements no Avalanche gameplay.
Zealot was regenerated to show two swords; earlier single-sword candidates are not shipped.

Packing: split each source into its uniform 6 by 10 grid, retain a four-source-pixel inset gutter,
nearest-resize each cell to 128 square pixels, then compose a 768 by 1280 RGBA high-density
atlas. Nearest-resize to 384 by 640 for standard density; save both as lossless WebP. Alpha is
preserved. Selection portraits contain the original reference within a dark 512 by 768 canvas,
with a 256 by 384 standard rendition, saved as lossless WebP. Native-size card, refraction and mini renditions bake the existing `archUnitPath.ts`
selection mask into alpha; roster tiles retain their square crop. No watermark removal is applied.

## Source hashes

- `assassin`: `8026e904-46be-4d2c-93ad-40812f27e23e.avif`
  - Reference SHA-256: `bf692b9fce95df2f2620725d9823de7b2e7400278f670e96f0fc4f5874d11db8`
  - Generated sheet SHA-256: `c52b691aef275975eaf6c04ae1ac3386cb81c70efec8cc4adb4def1f752b15eb`
- `knight`: `Gemini_Generated_Image_vpyd7fvpyd7fvpyd.jpeg`
  - Reference SHA-256: `40449a8164b20a41d73cb911a71410104318b4d276e690323be40b7e6dd7fbb4`
  - Generated sheet SHA-256: `868080e16e0493d1beddbf88a6de0410e508b2d81de080262645b615f96b11f5`
- `paladin`: `ayqniwg53.webp`
  - Reference SHA-256: `2f403ea7b5a4b002e0022bc4c92e2571aeb131abfa98d815367b7e35cd42cd46`
  - Generated sheet SHA-256: `5d616cdc98ff9e3117e6cd252fa8970cfed1e2f2cd84b498ba900c81a08fdaae`
- `colossus`: `flat750x075f-pad750x1000f8f8f8.jpg`
  - Reference SHA-256: `4d6ce58bbbf48e9d31fa2ee004a96d498823cd064ecdf2db7c81ad6ed9708da6`
  - Generated sheet SHA-256: `22068128b4e5e99a746079517a01a3e0bacc773a02c5e8b806322e1e3f17c52c`
- `juggernaut`: `3a3b993770906ed01544422b12c6fb37.jpg`
  - Reference SHA-256: `e8be834add703e04cf1618cc317055197d3b6bc53c1d994c2814b40845d81112`
  - Generated sheet SHA-256: `625eefbcb046044021b72cdb3e838c2f70ff0dd6da2e9e42c9de0211fd5f3d99`

## ZIP references

The four ZIP archives are inspiration only. Their images and the Oracle video are not shipped.
Existing Magus atlases remain intact. Catalyst references inform fire motes, Oracle references
radiant rays, and Heretic references violet orbits. Tower references inform code-drawn stepped
plinths, pillars, wing reliefs and faction crystals. No executable content from the ZIPs is used.

## Attachment provenance approval

On 2026-11-13, Gurshaan approved the documented attachment route with hashes and permission
confirmation (ADR 0028). Both the portrait and atlas entries identify their original attachment
through the registered reference ID; all filenames and original hashes remain recorded above.
This approval changes source documentation handling, not the underlying artwork permission.

## 2026-11-13 — Isolated-pose repair

The five non-Magus sheets were repacked from the same generated sources listed above. The
earlier uniform source-grid assumption included strips of neighbouring poses. Each of the 300
poses is now isolated using per-row and per-pose transparent seams, with detached edge strips
and small neighbouring fragments discarded. Packing preserves aspect ratio, one scale per
character and a common ground baseline at pixel 119 in each 128-pixel high-density cell.
Every pose has at least eight transparent pixels at each cell edge (four at standard density).
Both densities were checked across all cells, and the five labelled contact sheets were visually
inspected across idle, four walking directions, attack and all four preview rows. No new image
generation or source artwork was used. Magus sheets and selection portraits are unchanged.

The repaired five-atlas totals are 1,097,818 / 3,856,300 bytes (standard / high density).
Exact match-group totals decrease to 2,410,484 / 8,305,770 bytes, within ADR 0027's approved
allowance; the manifest test pins these smaller totals and the binary-integrity test pins the
new hashes in `legendSpriteAssets.ts`. The original dated generation record remains above.

Large combat effects are now code-drawn outside the sprite cells. Class-pool previews still
have no gameplay effects. Warrior playback covers Veil, Blade Runner, Hamstring and Fury;
Sentinel playback covers Shield Wall, Sunder, Colossus Roar and Meteor Fall. Decorative ground
scars expire, and the cast history has a hard cap. HUD CSS uses per-character motifs and honours
reduced motion. Existing weapon damage still triggers the attack animation, including scenery
hits, but cannot interrupt an active combat ability preview.
