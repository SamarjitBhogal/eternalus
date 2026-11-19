---
title: 0028. User attachment art provenance
description: Explicit provenance route for contributor-supplied local references.
audience: [humans, agents]
status: active
owner: gurshaan
last-reviewed: 2026-11-13
tags: [adr, assets, provenance, guardrails]
related:
  - docs/architecture/14-persistence-and-resources.md
  - docs/reference/legend-sprite-provenance.md
---

# 0028. User attachment art provenance

- Status: accepted by Gurshaan on 2026-11-13
- Date: 2026-11-12

## Context

The user supplied five local character references and confirmed permission to use and adapt
them. The existing manifest provenance assertion accepts only a public URL or a Figma node.
An attachment can have documented provenance without either, but invented links would be false.
The additional asset byte allowance in ADR 0027 does not change this provenance rule.

## Decision

Allow an explicit alternative for user attachments: structured reference metadata identifying
the original filename, its SHA-256, who confirmed permission and when, and the repository's
provenance record. Derived portraits and sprites must identify that same registered reference.
The existing URL/Figma route remains intact. Missing, malformed or unregistered attachment
records must still fail validation; a filename alone is not sufficient.

Gurshaan approved this route on 2026-11-13. Extend `AssetManifest.test.ts` with the
shared provenance validator and rejection tests. Keep every licence,
file-integrity, byte-budget and ownership assertion. Preserve original credits and classify
contributor-authorised art separately from the existing owner-made artwork licence.

`attachmentReferences.ts` holds the registered records; derived entries carry
`attachmentReferenceId`. `hasAssetProvenance` validates the registry and the checked-in record.
Architecture 14 describes this contract;
do not change coverage, lint or the guardrail approval process in `docs/process/guardrails.md`.

Alternatives: obtain original public source URLs; retain placeholders until provenance passes.

## Consequences

Local attachments become an explicit auditable source rather than an implicit exception.
The permission record is the contributor's confirmation, not independent licence verification.
The approval covers this structured route; filename-only exceptions remain forbidden.
