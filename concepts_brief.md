# NVMSA OS v1.0 — Platform Core & Content Calendar

* **Author:** Mostafa Yaser
* **Date:** 2026-11-26

## Overview

NVMSA OS v1.0 delivers a mobile-first web PWA on Cloudflare Workers and Cloudflare D1 containing two scoped subsystems: (1) a shared Platform Core with Google OAuth authentication, D1-backed `office_seats` and `org_units` governance, and security middleware; and (2) Module 1 (Content Calendar), enforcing a 1-post-per-Cairo-day limit (`Africa/Cairo`), unit-scoped booking, 3-layer write concurrency, atomic D1 audit logging, clear visual contrast between open and booked days on a fixed 42-cell grid, and Two-Step Relocation Placement Mode.

## Reviewer Status

| Reviewer Lens | Status |
| :--- | :--- |
| `egm-design` (Hostile Design Critic / Cost & Quota) | completed |
| `egm-codebase-details` (Codebase Details / Observability & SRE) | completed |
| `egm-zoom-out` (Contrarian / YAGNI & Minimization) | completed |
| `egm-comprehension` (UX & Developer Ergonomics) | completed |
| `egm-implementation-readiness` (Migration & Backward Compatibility) | completed |
| `egm-structural` (Long-Term Tech Debt & Maintainability) | completed |
| `egm-inventive-catalyst` (Contradiction Elimination & Inventive Transforms) | completed |

## Analysis

### 1. Blockers Found Across the Codebase and Specs

1. **Three Conflicting Org-Unit and Role Taxonomies**
   * `docs/ROLE_HIERARCHY.md` defines 4 Support Divisions (`CBSDD`, `PSDD`, `PNSDD`, `RSDD`) without `FSDD` or `EB`, and grants cross-seat override and past-date backfill to `PNSDD`, `VP`, `SecGen`, `TREAS`, `PRES`, and `super_admin` across 6 non-linear tiers.
   * `src/shared/constants/divisions.ts` and `docs/specs/NVMSA_OS_MASTER_SPEC.md` define 5 entities (`PNSDD`, `PSDD`, `CBDD`, `FSDD`, `EB`) without `RSDD`, while `src/shared/constants/roles.ts` and `src/server/modules/calendar/calendar.policy.ts` enforce 3 linear roles (`officer`, `eb`, `admin`) with zero unit checks (`BookingSheet.tsx` lets any EB user pick any of the 11 entities).
   * The concept sets unit-scoped booking for Standing Committee Officers and Support Division Directors (plus `LEO & LORE` picking `SCOPE` or `SCORE`), without specifying which `org_units` `PRES`, `VP`, `SecGen`, `TREAS`, `PNSDD`, and `super_admin` may book under.
   * *Technical resolution*: Reconcile one canonical seed list before schema freeze. Store active units in D1 `org_units` referencing a closed set of pre-compiled WCAG-AA palette tokens (so runtime D1 edits do not break Tailwind v4 CSS purging or fail static `z.enum(NVMSA_ENTITY_CODES)` checks). Replace `hasMinimumRole` with capability flags plus a `seat_allowed_units` mapping (`['SCOPE', 'SCORE']` for `LEO & LORE`) enforced in both server policy and client form controls.

2. **`super_admin` Visibility, Seat-Edit Authority, and Audit Masking Contradiction**
   * `docs/ROLE_HIERARCHY.md` requires `super_admin` (`mostafa.yaser.developer@gmail.com`) to come solely from Worker secret `SUPER_ADMIN_EMAIL`, stay hidden from directories and role pickers, and never be assignable via HTTP. Seeding `super_admin` into a D1 `office_seats` table editable by `PRES` breaks that boundary and lets `PRES` view or overwrite break-glass recovery access.
   * Masking `super_admin` only inside officer-visible audit logs (`GET /slots/:id/history`) still leaks `Mostafa Yaser` via `PublicSlotView.creatorName` (`calendar.service.ts:31`) on public calendar cells, omits `super_admin` actions from `SC`/`SD` timelines if rows are dropped, and creates ambiguity over whether `officer-visible` covers unauthenticated public viewers or authenticated SC/SD Officers.
   * *Inventive resolution (Extraction + Segmentation)*: Keep `super_admin` completely outside `office_seats` and the `PRES` admin UI; resolve it solely from `SUPER_ADMIN_EMAIL`. Write true `actor_id` and `actor_role: 'super_admin'` into D1 `slot_audit_log` (requiring a non-empty `reason` and correlating via `request_id`), and project a deterministic alias (such as `"Platform Maintenance"` with `actorId: null`) across every non-`super_admin` API response (`slot_audit_log`, `PublicSlotView`, and `ManagedSlotView`).

3. **Mutable `office_seats` vs. Stale Sessions and `creatorId` Slot Lockout**
   * `src/server/core/auth/session.ts` reads `role` and `entityCode` stored on Better Auth's `user` table, and `calendar.policy.ts` locks edit, relocate, and cancel rights to `slot.creatorId === user.id`.
   * When `PRES` or `super_admin` updates a seat's Gmail in `office_seats`: (a) the outgoing holder's existing Better Auth `session` remains active until expiration unless revoked, and (b) the incoming officer gets a new `user.id` and hits `403 Forbidden` when trying to edit future slots created by their predecessor for that same committee seat.
   * *Inventive resolution (Intermediary + Inversion)*: Resolve active seat tier and `allowedOrgUnits` dynamically from `office_seats` on session checks; wrap seat email updates inside an atomic `db.batch()` that revokes all `session` rows for the displaced email, logs the seat change, enforces `UNIQUE(assigned_email)`, and prevents `PRES` from deleting or locking out the sole `PRES` seat. Decide explicitly whether slot edit ownership binds to `seat_code` (surviving handovers) or `creator_id`.

4. **Cloudflare D1 `db.batch()` Partial-Commit Bug Under OCC (`412`)**
   * `src/server/modules/calendar/calendar.repository.ts` runs mutations and audit writes as separate queries, omits `expectedVersion` in `cancelSlot()`, lacks `412`/`422` `DomainError` classes, and catches any SQLite `'unique constraint failed'` string as a booked-date conflict (`calendar.repository.ts:31-39`).
   * Inside D1 `db.batch([UPDATE_with_version, INSERT_audit, INSERT_idempotency])`, an `UPDATE ... WHERE id = ? AND version = ?` matching `0` rows due to a stale version does **not** raise an SQL error—subsequent `INSERT` statements in the same batch still execute and commit a bogus audit entry and cached `200` idempotency row!
   * *Inventive resolution (Self-Service)*: Attach a per-mutation `last_mutation_id` UUID on `post_slots` and guard batched audit and idempotency writes with `INSERT ... SELECT ... WHERE id = ? AND last_mutation_id = ?` (or `WHERE changes() = 1`), inspect `results[0].meta.changes` before returning `200` vs `412`, tighten `isUniqueConstraintError` to match `uq_active_post_date`, and prune expired `idempotency_keys` asynchronously via `ctx.waitUntil()` or a Worker Cron Trigger.

5. **Google OAuth-Only Mobile, Shared-Gmail, and Preview Hazards**
   * `src/server/core/auth/auth.ts:40-42` configures only `emailAndPassword` (`baseURL` also falls back to `localhost:5173` in prod, and `session.ts:61-63` swallows errors silently). Switching to Google OAuth-only without Email OTP exposes four failure modes:
     1. Links opened inside WhatsApp or Instagram in-app browsers fail Google OAuth with `403 disallowed_useragent`, and iOS standalone PWAs lose unsaved form drafts on full-page redirects or isolate cookies in external Safari sheets.
     2. Shared committee Gmails (`lpoo.nvmsa@gmail.com`) across student devices trigger Google 2FA challenges with zero fallback login method; Google Cloud "Testing" mode caps users at 100 manually added addresses; personal Gmail cookies trap users in a `403` loop without `prompt: 'select_account'`.
     3. Better Auth OAuth callbacks auto-create `user` rows for any Google user unless blocked in **both** `user.create.before` and `session.create.before` (checking `email_verified === true` and normalized email against `office_seats` + `SUPER_ADMIN_EMAIL`).
     4. Dynamic Cloudflare PR preview subdomains (`*.workers.dev`) break Google Cloud's strict `redirect_uri` allowlist, and local `x-dev-role` bypasses D1 `office_seats` resolution during tests.
   * *Mitigations*: Publish the Google OAuth app (non-sensitive scopes only), use `prompt: 'select_account'`, detect embedded WebViews and prompt users to open in Safari/Chrome, allow `office_seats` to bind officers' personal Gmail addresses as well as official ones, keep `SUPER_ADMIN_EMAIL` and `GOOGLE_*` env checks fail-closed at startup, and test auth/seat logic against a fixed staging URL + real D1 Miniflare sessions.

6. **Clean Reset Schema vs. Existing D1 Migration History (`wrangler.jsonc`)**
   * `wrangler.jsonc:10-16` already binds `nvmsa-os-db` (`database_id: 1271c546-fe90-410c-b716-070882d6b3f6`) with `0000_init_calendar.sql` and `0001_audit_and_versioning.sql` (`calendar_slots` / lowercase enums), while `NVMSA_OS_MASTER_SPEC.md` specifies a `0002` Expand-and-Contract backfill (`post_slots` / uppercase enums) and CI lint banning `DROP TABLE`. Overwriting `0000` in place causes `wrangler d1 migrations apply` to skip already-applied filenames on existing databases.
   * *Mitigation*: Either create a brand-new D1 database ID (resetting local `.wrangler/state` too) before applying the clean `0000` schema, or explicitly drop/clear `d1_migrations` pre-launch alongside bumping SW cache (`nvmsa-os-v2`) and SWR key prefixes (`nvmsa_os_swr:v2:<scope>:...`).

### 2. UX, Grid, and Free-Tier Quota Gaps

* **Filter-Hides-Booked and Overflow-Cell Illusions**: `CalendarPage.tsx:39-48` removes filtered-out units before passing slots to `CalendarGrid`, making booked days appear `"Open"` (`DayCell.tsx:48-67`). Switching `buildMonthGrid` (`src/shared/utils/date.ts`) to a fixed 42 cells exposes up to 13 adjacent-month days while `calendar.service.ts:78-80` only queries `[YYYY-MM-01..lastDay]`—rendering booked overflow dates as `"Open"`. Fix both by querying `[gridCells[0].isoDate .. gridCells[41].isoDate]`, keeping all booked cells visible (dimming non-matching units when filtered), and controlling Placement Mode via a single discriminated-union state machine rather than independent booleans.
* **SWR Cache Leakage & Frozen Cairo Midnight**: `useSession.tsx:86-97` never clears `nvmsa_os_swr:*` on `signOut()`, leaking internal notes on shared devices; `useCalendarMonth.ts:20` freezes `todayCairo` across midnight; `YearMonthSchema` accepts `2026-00` and `2026-99`; `public/sw.js` caches non-2xx responses and lacks `/calendar` offline fallback.
* **Admin View Placement & D1 Quota Amplification**: Putting `office_seats` + `org_units` admin UI inside a v1.0 build that cuts `Member Hub` requires defining a lazy-loaded `/admin` drawer/route (hidden from non-`PRES`/`super_admin` users) so entry JS stays within budget (`100.47 KB` baseline vs `≤ 108 KB` target). Skipping D1 `sessionMiddleware` queries when no auth cookie exists and caching unauthenticated `GET /month` via Cloudflare Cache API protects Free-tier D1 read limits (`5M rows/day`); `wrangler.jsonc` also needs a separate `env.preview` D1 database and an explicit approach for CGNAT-safe rate limiting.

### 3. YAGNI Scope Challenges (Ideal Final Result vs. Over-Engineering)

Goldfish reviewers flagged four areas where complexity outweighs v1.0 value for a 13-seat association app:
1. **`PUBLISHED` workflow state**: Locks owners out of their own booked slots after marking them published; open-vs-booked contrast does not require a separate publish state machine in v1.0.
2. **Heavy motion theatrics (`domMax` drag-vs-scroll, SVG sparks, `navigator.vibrate`)**: `navigator.vibrate()` is unsupported on iOS Safari, and `domMax` consumes most of the `32 KB` async chunk budget alongside `AdminSeatsView`—CSS/WAAPI or lean `domAnimation` covers spring sheets, month swipes, and Two-Step Placement Mode with fewer iOS touch bugs.
3. **Separate `idempotency_keys` table + Cron pruner**: For 13 writers (~30 posts/month), `uq_active_post_date` (`409`), OCC `expectedVersion` (`412`), and a synchronous `useRef` submit guard prevent double-bookings without 3x write overhead—unless automatic background HTTP retry is actually required.
4. **Live `office_seats` / `org_units` CRUD vs. Static Config + v2.0 Handovers**: Building seat/unit CRUD in v1.0 forces immediate session revocation, duplicate-email guards, `seat_audit_log`, and soft-delete rules; keeping `office_seats` and `org_units` seeded in D1 while deferring full UI editing (or narrowing v1.0 to seat-email swap + unit active toggle only) lowers launch risk.
5. **Planned Module 2 & 3 Bottom Nav Tabs**: `modules.registry.ts` currently mounts `Activities` and `Members` placeholders; hiding them in v1.0 frees vertical height on `375px` mobile screens for the 42-cell calendar.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Platform Core on Cloudflare Workers + D1 (clean reset schema) with Google OAuth-only sign-in (`emailAndPassword` disabled, allowlisted via D1 `office_seats` + Worker secret `SUPER_ADMIN_EMAIL`).
  * Reconciled, data-driven `org_units` and 13 `office_seats` (including `lpoo.nvmsa@gmail.com`) editable in a lazy-loaded `/admin` view by `PRES` (visible seats only) and `super_admin`, with atomic session revocation on seat changes.
  * Hidden `super_admin` (`mostafa.yaser.developer@gmail.com`) excluded from directories/UI and masked across officer-visible audit logs and slot summaries while recorded unmasked in D1.
  * Content Calendar Module 1: 1-post-per-Cairo-day uniqueness (`Africa/Cairo`), unit-scoped booking (`LEO & LORE` selects `SCOPE` or `SCORE`), 3-layer write concurrency with atomic guarded `db.batch()` audit logging, unmistakable open-vs-booked contrast on a fixed 42-cell grid, and Two-Step Relocation Placement Mode.
  * Hardened PWA (`public/sw.js` safe caching + `/calendar` offline fallback, role-scoped SWR cache cleared on sign-out, dynamic `useCairoClock()`, strict `YearMonthSchema`, and WhatsApp WebView / iOS OAuth resilience).
* **Out-of-Scope Non-Goals:**
  * Module 2 (`Activities & Events`) and Module 3 (`Recruitment & Member Hub`), including hiding placeholder tabs from v1.0 navigation.
  * Email OTP / custom-domain email sending (deferred to a follow-up milestone once DNS/SPF/DKIM and provider setup are ready).
  * Multi-tenant / multi-university organization sharding.

## Alternatives Weighed

* **Building Modules 2 and 3 (`Activities`, `Member Hub`) in this build** — Rejected by author: workflows, schemas, and permissions are undefined and would stall Content Calendar delivery.
* **Backward-compatible `0002` Expand-and-Contract backfill from v1.0 `calendar_slots`** — Rejected by author: pre-launch D1 database can be reset cleanly to the new schema before release.
* **Email/password sign-up and launch-day Email OTP** — Rejected by author: Google OAuth verifies the 13 official Gmail seats plus `super_admin` without running email infrastructure; Email OTP is deferred until custom-domain sending is added later.
* **Static hardcoded 13-email allowlist with no v1.0 admin editor** — Rejected by author: `office_seats` and `org_units` must live in D1 and be editable in an admin view by `super_admin` and `PRES`.
* **Exposing `super_admin`'s real name/role in officer-visible audit logs** — Rejected by author: mask `super_admin` identity in officer-visible views while keeping true actor attribution in D1.

## Key Decisions & Staging for Next Steps

* **Resolved Decisions:**
  * Clean D1 schema reset pre-launch (requires fresh D1 database ID or explicit reset script plus bumped SW/SWR cache versions).
  * Google OAuth-only for v1.0; `emailAndPassword` disabled; Email OTP deferred.
  * `lpoo.nvmsa@gmail.com` confirmed intentional for `LPO` (`SCOPH`).
  * SC Officers and SD Directors restricted to booking only their assigned `org_unit`(s), with `LEO & LORE` picking `SCOPE` or `SCORE`.
* **Open Objections Requiring Decisions Before `/egm-draft`:**
  1. **Reconcile `org_units` and `EB`/`PNSDD` permissions**: Which Support Division set governs—`ROLE_HIERARCHY.md` (`CBSDD`, `RSDD`) or `divisions.ts` (`CBDD`, `FSDD`, `EB`)—and which `org_units` may `PRES`, `VP`, `SecGen`, `TREAS`, `PNSDD`, and `super_admin` book under?
  2. **Slot ownership & `super_admin` masking boundary**: When a seat's Gmail is reassigned in `office_seats`, does edit permission on existing future slots follow the **Seat** (`seat_code`) or stay locked to the original `user.id`? Should `super_admin` stay in Worker secret `SUPER_ADMIN_EMAIL` (invisible and uneditable by `PRES`) and mask identically across `creatorName` and `slot_audit_log` for all non-`super_admin` viewers?
  3. **Admin view scope & YAGNI cuts**: Keep the `/admin` view scoped to updating `office_seats` emails + adding/toggling `org_units` (using closed palette tokens and revoking old sessions atomically), and confirm whether to keep or cut `PUBLISHED` status, `idempotency_keys`, and `domMax` drag-particle/vibrate extras in v1.0.
