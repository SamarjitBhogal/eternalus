---
title: Magus sprite provenance
description: Generation references, source hashes and packing notes for the three Magus animation sheets.
audience: [humans, agents]
status: draft
owner: gurshaan
last-reviewed: 2026-11-11
tags: [assets, provenance, magus]
---

# Magus sprite provenance

Generation record (the brief below summarises the image-generation prompts):

```text
Generated with Codex built-in image generation on 2026-11-11.

References: the existing owner-licensed Catalyst, Oracle and necromancer (Heretic)
card-idle@2x selection art in src/assets/selection/legends/. These references are
already registered as owner art in selectionCardArtAssets.ts (DEC-51).
The unlicensed golden-knight reference was not used.

Generation brief: create separate transparent pixel-art animation sheets matching
each reference's armour, wings, staff and palette. Six columns, ten rows, six poses
per animation, full bodies with consistent scale and breathing room between cells.
Rows: idle south; walk south; walk north; walk west; walk east; ranged staff cast;
Imbue; Shockwave; Sanctuary; Nova. No melee attack, labels or additional characters.
Colours: Catalyst fiery gold/red, Oracle silver/ivory, Heretic dark violet/black.

Original image SHA-256:
Catalyst 636d55a14ca4aaec08b62b1ee28f7592ac5216cde5610c277e750b13d6b84e6c
Oracle 7d1de75715c518965aaf57535778049fe3985662994fe7ae039d0576cc782d04
Heretic e258cf05c244ca4769dbd25131ed2c752d4c39566785af529f3e601c526fe1e0

Packing: source 971 x 1619 RGBA, uniform 6 x 10 cell grid; remove four source
pixels inside each cell edge as a bleed gutter; fit cells to 128 x 128 using nearest
sampling; compose 768 x 1280 high-density sheet; nearest resize to 384 x 640 for
standard density. Both saved as lossless WebP using the bundled sharp runtime.
Alpha was preserved; no background recolouring or replacement asset was used.

Match byte allowance approved by Gurshaan on 2026-11-11; atlases registered under ADR 0026.

```
