# NVMSA OS — Role Hierarchy & Governance Specification

**Document Version:** 1.0  
**Applies To:** NVMSA OS (v1.0 Content Calendar → v2.0 Member Hub)  
**Audience:** NVMSA Executive Board, Standing Committee Officers, Support Division Directors, and Technical Maintainers  

---

## 1. Purpose & Design Philosophy

NVMSA OS models **New Valley Medical Students' Association (NVMSA)** around two core governance principles:

1. **Visible Organizational Hierarchy vs. Hidden Platform Layer**  
   Users only ever see NVMSA's 13 official leadership positions (Executive Board, Standing Committee Officers, and Support Division Directors) and, in v2.0, general members. System-level administration (`super_admin`) operates strictly in the background and is never exposed in user-facing directories, role pickers, or public UI badges.
2. **Seat-Based Authority Built for Annual Handovers**  
   Because student association leadership rotates every term, authority in NVMSA OS belongs to an **Official Seat** (e.g., `PRES`, `LPO`, `PNSDD`), not permanently to an individual.  
   - **Phase 1 (v1.0 — Current):** Registration is restricted exclusively to the 13 fixed official NVMSA emails (plus the hidden `super_admin` bootstrap).  
   - **Phase 2 (v2.0 — Planned):** All NVMSA members register with personal accounts (`member` role), and the **President (`PRES`)** transfers any of the 13 Official Seats from an outgoing officer to an incoming officer with zero password sharing and a complete historical audit trail.

---

## 2. Role Hierarchy Overview

```text
[HIDDEN SYSTEM LAYER — Invisible in UI]
└── Tier 0: Super Admin (`super_admin`)
    └── Platform infrastructure, break-glass recovery, schema & security governance

[VISIBLE NVMSA ORGANIZATIONAL HIERARCHY]
├── Tier 1: Executive Board (`eb`)
│   ├── President (`PRES`) ─────────────────── Highest visible authority; owns v2.0 seat handovers
│   ├── Vice President (`VP`) ──────────────── Executive oversight & calendar governance
│   ├── Secretary General (`SecGen`) ───────── Records, governance & calendar oversight
│   └── Treasurer (`TREAS`) ────────────────── Finance & executive calendar oversight
│
├── Tier 2: Standing Committee Officers (`officer_sc`)
│   ├── Local Public Health Officer (`LPO`) ── SCOPH
│   ├── Local Officer on Human Rights & Peace (`LORP`) ── SCORP
│   ├── Local Officer on Medical Education (`LOME`) ──── SCOME
│   ├── Local Officer on Sexual & Reproductive Health and Rights (`LORA`) ── SCORA
│   └── Local Exchange Officer & Local Officer on Research Exchange (`LEO & LORE`) ── SCOPE & SCORE
│
├── Tier 3: Support Division Directors (`officer_sd`)
│   ├── Capacity Building Support Division Director (`CBSDD`)
│   ├── Project Support Division Director (`PSDD`)
│   ├── Publication & New Technology Support Division Director (`PNSDD`) ── Calendar Ops & Publishing Lead
│   └── Research Support Division Director (`RSDD`)
│
└── Tier 4: General Members & Public (`member` / unauthenticated)
    ├── v1.0: Read-only public access (no sign-in required)
    └── v2.0: Personal member accounts eligible to be assigned Official Seats by PRES
```

---

## 3. Official Seat Directory (13 Visible Positions)

In **v1.0**, only the 13 official addresses below are allowlisted for self-registration (matched case-insensitively after trimming).

| # | Branch | Official Title | Code | Official Email (v1.0 Allowlist) | System Tier |
| :-: | --- | --- | --- | --- | --- |
| 1 | Executive Board | President | `PRES` | `president.nvmsa@gmail.com` | `eb_president` |
| 2 | Executive Board | Vice President | `VP` | `vp.nvmsa@gmail.com` | `eb` |
| 3 | Executive Board | Secretary General | `SecGen` | `sec.gen.nvmsa@gmail.com` | `eb` |
| 4 | Executive Board | Treasurer | `TREAS` | `treasurer.nvmsa@gmail.com` | `eb` |
| 5 | Standing Committee | Local Public Health Officer | `LPO` | `lpoo.nvmsa@gmail.com` | `officer_sc` |
| 6 | Standing Committee | Local Officer on Human Rights and Peace | `LORP` | `lorp.nvmsa@gmail.com` | `officer_sc` |
| 7 | Standing Committee | Local Officer on Medical Education | `LOME` | `lome.nvmsa@gmail.com` | `officer_sc` |
| 8 | Standing Committee | Local Officer on Sexual & Reproductive Health and Rights | `LORA` | `lora.nvmsa@gmail.com` | `officer_sc` |
| 9 | Standing Committee | Local Exchange Officer & Local Officer on Research Exchange | `LEO & LORE` | `leo.lore.nvmsa@gmail.com` | `officer_sc` |
| 10 | Support Division | Capacity Building Support Division Director | `CBSDD` | `cbsdd.nvmsa@gmail.com` | `officer_sd` |
| 11 | Support Division | Project Support Division Director | `PSDD` | `psdd.nvmsa@gmail.com` | `officer_sd` |
| 12 | Support Division | Publication & New Technology Support Division Director | `PNSDD` | `pnsdd.nvmsa@gmail.com` | `officer_sd_ops` |
| 13 | Support Division | Research Support Division Director | `RSDD` | `rsdd.nvmsa@gmail.com` | `officer_sd` |

### Hidden Background Role (Excluded from Public Directory)

| Role Code | Visibility | Assigned Account | Purpose |
| --- | --- | --- | --- |
| `super_admin` | **Hidden** (never shown in UI, role dropdowns, or public profiles) | `mostafa.yaser.developer@gmail.com` *(configured via Wrangler secret)* | Platform maintainer, break-glass recovery, seat-transfer override if `PRES` loses access, and security/audit administration |

---

## 4. Permission & Capability Matrix

| Capability | Public / `member` | SC Officer / SD Director (`LPO`, `LORP`, `LOME`, `LORA`, `LEO & LORE`, `CBSDD`, `PSDD`, `RSDD`) | `PNSDD` (Publishing Ops) | Executive Board (`VP`, `SecGen`, `TREAS`) | President (`PRES`) | `super_admin` (Hidden) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Register / Sign In (v1.0)** | No (Read-only) | Yes (Fixed email) | Yes (Fixed email) | Yes (Fixed email) | Yes (Fixed email) | Yes (Hidden allowlist) |
| **Register / Sign In (v2.0)** | Yes (Personal email) | Via Seat Assignment | Via Seat Assignment | Via Seat Assignment | Via Seat Assignment | Yes (Hidden secret) |
| **View Public Content Calendar** | Yes | Yes | Yes | Yes | Yes | Yes |
| **View Internal Notes & Relocation Queue** | No | Yes | Yes | Yes | Yes | Yes |
| **Book Open Calendar Slot (1/day)** | No | Yes | Yes | Yes | Yes | Yes |
| **Edit / Relocate / Cancel Own Slot** | No | Yes | Yes | Yes | Yes | Yes |
| **Edit / Relocate / Cancel Another Seat's Slot** | No | No | Yes | Yes | Yes | Yes |
| **Backfill Past Cairo Dates** | No | No | Yes | Yes | Yes | Yes |
| **View Slot Audit History** | No | Yes | Yes | Yes | Yes | Yes |
| **Assign / Hand Over Official Seats (v2.0)** | No | No | No | No | **Yes** | **Yes (Break-glass)** |
| **Manage System Config & Security Flags** | No | No | No | No | No | **Yes** |

---

## 5. Phased Rollout & Handover Lifecycle

### Phase 1 (v1.0): Official Seat Allowlist

- **Strict Sign-Up Gate:** The Better Auth sign-up hook normalizes the submitted email (`email.trim().toLowerCase()`) and checks it against the 13 official NVMSA seat emails (plus the environment-configured `SUPER_ADMIN_EMAIL`). Any non-allowlisted email is rejected with `403 Forbidden`.
- **Automatic Seat Binding:** Upon successful registration, the server automatically assigns the user's `seatCode` (e.g., `PRES`, `LPO`, `PNSDD`) and system role tier—users never self-select a role on the client.
- **Public Read-Only Default:** General NVMSA members and guests can open the PWA immediately with zero login friction to view the live monthly content schedule (stripped of internal notes and creator IDs).

### Phase 2 (v2.0): Open Member Accounts & Presidential Seat Handover

To support annual elections without sharing Gmail passwords or losing historical attribution, v2.0 introduces two relational tables:

1. **`office_seats`** — The 13 immutable NVMSA seat records (`code`, `branch`, `title`, `tier`, `current_user_id`).
2. **`seat_assignment_logs`** — Append-only history of every appointment and handover (`seat_code`, `previous_user_id`, `new_user_id`, `assigned_by_user_id`, `term_label`, `created_at`).

**Handover Workflow (Executed by `PRES`):**
1. Incoming and outgoing members both hold personal `member` accounts.
2. `PRES` opens **Governance → Official Seats**, selects a seat (e.g., `LPO`), and picks the incoming member.
3. In a single D1 transaction:
   - The outgoing holder's active `seatCode` is cleared and their effective role reverts to `member`.
   - The incoming member receives the `seatCode` and its corresponding tier permissions.
   - An immutable row is appended to `seat_assignment_logs`.
   - Historical calendar slots and audit entries remain permanently attributed to the person who created them alongside the seat they held at the time.
4. **Presidential Succession (`PRES` → New `PRES`):** When the outgoing President transfers the `PRES` seat to the newly elected President, the transaction requires explicit re-authentication and immediately downgrades the outgoing President to `member`. If `PRES` ever loses account access, `super_admin` performs a break-glass transfer.

---

## 6. Security & Non-Visibility Rules for `super_admin`

- **Invisible by Default:** API responses for public member directories, seat listings, and UI role selectors MUST filter out `role === 'super_admin'`.
- **Server-Only Provisioning:** `super_admin` is resolved strictly from a Cloudflare Worker secret (`SUPER_ADMIN_EMAIL`), never hardcoded in client bundles and never assignable via any HTTP endpoint.
- **Full Accountability:** Even though `super_admin` is hidden from organizational directories, every mutating action taken by `super_admin` (slot edits, overrides, or break-glass seat transfers) is still recorded in the append-only audit log for integrity.
