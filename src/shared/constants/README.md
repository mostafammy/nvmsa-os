# Constants

## Overview
Shared domain constants and lookup helpers for NVMSA organizational entities (standing committees and support divisions) and user authorization roles. This package defines the canonical entity metadata, code tuples, and role rank hierarchy consumed by validation schemas and application layers.

## Interface
- `[committees.ts:STANDING_COMMITTEES]` — `readonly` (`as const`) list of 6 standing committee objects (`SCOPH`, `SCORA`, `SCORP`, `SCOME`, `SCOPE`, `SCORE`) with `code`, `name`, `color`, and `badgeClass`.
- `[committees.ts:StandingCommitteeCode]` — Union type of standing committee `code` values.
- `[committees.ts:STANDING_COMMITTEE_CODES]` — Non-empty tuple `[StandingCommitteeCode, ...StandingCommitteeCode[]]` of standing committee codes.
- `[divisions.ts:SUPPORT_DIVISIONS]` — `readonly` (`as const`) list of 5 support division objects (`PNSDD`, `PSDD`, `CBDD`, `FSDD`, `EB`) with `code`, `name`, `color`, and `badgeClass`.
- `[divisions.ts:SupportDivisionCode]` — Union type of support division `code` values.
- `[divisions.ts:SUPPORT_DIVISION_CODES]` — Non-empty tuple `[SupportDivisionCode, ...SupportDivisionCode[]]` of support division codes.
- `[roles.ts:USER_ROLES]` — `readonly` (`as const`) role tuple `['officer', 'eb', 'admin']`.
- `[roles.ts:UserRole]` — Union type `'officer' | 'eb' | 'admin'`.
- `[roles.ts:ROLE_LABELS]` — `Record<UserRole, string>` mapping roles to display labels (`'Officer (Public)'`, `'EB Member'`, `'Admin'`).
- `[roles.ts:ROLE_RANK]` — `Record<UserRole, number>` mapping roles to numeric ranks (`officer: 0`, `eb: 1`, `admin: 2`).
- `[roles.ts:hasMinimumRole]` — `hasMinimumRole(role: UserRole, minimum: UserRole): boolean` returning `ROLE_RANK[role] >= ROLE_RANK[minimum]`.
- `[index.ts:NVMSA_ENTITIES]` — `readonly` (`as const`) combined list `[...STANDING_COMMITTEES, ...SUPPORT_DIVISIONS]`.
- `[index.ts:NvmsaEntityCode]` — Union type of all standing committee and support division `code` values.
- `[index.ts:NVMSA_ENTITY_CODES]` — Non-empty tuple `[NvmsaEntityCode, ...NvmsaEntityCode[]]` of all entity codes.
- `[index.ts:NVMSA_ENTITY_MAP]` — `Record<NvmsaEntityCode, (typeof NVMSA_ENTITIES)[number]>` lookup map keyed by `entity.code` (alongside `export *` re-exports from `./committees`, `./divisions`, and `./roles`).

## Invariants
- `[committees.ts:STANDING_COMMITTEE_CODES]`, `[divisions.ts:SUPPORT_DIVISION_CODES]`, `[index.ts:NVMSA_ENTITY_CODES]` — Code lists must remain typed as non-empty tuples (`[Code, ...Code[]]`) derived from the `as const` source arrays.
- `[index.ts:NVMSA_ENTITY_MAP]` — Indexes `NVMSA_ENTITIES` by `entity.code` via `Object.fromEntries`; `code` strings across `STANDING_COMMITTEES` and `SUPPORT_DIVISIONS` must be distinct to prevent key collisions.
- `[roles.ts:ROLE_LABELS]`, `[roles.ts:ROLE_RANK]`, `[roles.ts:hasMinimumRole]` — `ROLE_LABELS` and `ROLE_RANK` are exhaustive `Record<UserRole, ...>` maps over `USER_ROLES`, with strictly ascending numeric ranks (`officer: 0 < eb: 1 < admin: 2`) evaluated by `hasMinimumRole`.

## Side Effects
- None

## Verification
- Run: `pnpm test`
