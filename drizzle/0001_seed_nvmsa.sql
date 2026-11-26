-- NVMSA OS v1.0 Canonical Organization Units, Official Seats & Booking Scopes
-- Idempotent seed derived from docs/ROLE_HIERARCHY.md

-- 11 Canonical Organization Units (6 Committees, 4 Support Divisions, 1 Board)
INSERT OR IGNORE INTO org_units (id, code, name, kind, accent_token, is_active, created_at, updated_at) VALUES
  ('SCOPH', 'SCOPH', 'Standing Committee on Public Health', 'COMMITTEE', 'orange', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('SCORP', 'SCORP', 'Standing Committee on Human Rights and Peace', 'COMMITTEE', 'red', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('SCOME', 'SCOME', 'Standing Committee on Medical Education', 'COMMITTEE', 'green', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('SCORA', 'SCORA', 'Standing Committee on Sexual & Reproductive Health and Rights', 'COMMITTEE', 'rose', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('SCOPE', 'SCOPE', 'Standing Committee on Professional Exchange', 'COMMITTEE', 'blue', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('SCORE', 'SCORE', 'Standing Committee on Research Exchange', 'COMMITTEE', 'sky', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('CBSDD', 'CBSDD', 'Capacity Building Support Division', 'DIVISION', 'amber', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('PSDD', 'PSDD', 'Project Support Division', 'DIVISION', 'violet', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('PNSDD', 'PNSDD', 'Publication & New Technology Support Division', 'DIVISION', 'teal', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('RSDD', 'RSDD', 'Research Support Division', 'DIVISION', 'emerald', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('EB', 'EB', 'Executive Board', 'BOARD', 'indigo', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

-- 13 Visible Official Seats (trimmed lowercase Gmail allowlist)
INSERT OR IGNORE INTO office_seats (seat_code, branch, title, tier, assigned_email, is_active, updated_at) VALUES
  ('PRES', 'EXECUTIVE_BOARD', 'President', 'eb_president', 'president.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('VP', 'EXECUTIVE_BOARD', 'Vice President', 'eb', 'vp.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('SecGen', 'EXECUTIVE_BOARD', 'Secretary General', 'eb', 'sec.gen.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('TREAS', 'EXECUTIVE_BOARD', 'Treasurer', 'eb', 'treasurer.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('LPO', 'STANDING_COMMITTEE', 'Local Public Health Officer', 'officer_sc', 'lpoo.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('LORP', 'STANDING_COMMITTEE', 'Local Officer on Human Rights and Peace', 'officer_sc', 'lorp.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('LOME', 'STANDING_COMMITTEE', 'Local Officer on Medical Education', 'officer_sc', 'lome.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('LORA', 'STANDING_COMMITTEE', 'Local Officer on Sexual & Reproductive Health and Rights', 'officer_sc', 'lora.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('LEO & LORE', 'STANDING_COMMITTEE', 'Local Exchange Officer & Local Officer on Research Exchange', 'officer_sc', 'leo.lore.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('CBSDD', 'SUPPORT_DIVISION', 'Capacity Building Support Division Director', 'officer_sd', 'cbsdd.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('PSDD', 'SUPPORT_DIVISION', 'Project Support Division Director', 'officer_sd', 'psdd.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('PNSDD', 'SUPPORT_DIVISION', 'Publication & New Technology Support Division Director', 'officer_sd_ops', 'pnsdd.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z'),
  ('RSDD', 'SUPPORT_DIVISION', 'Research Support Division Director', 'officer_sd', 'rsdd.nvmsa@gmail.com', 1, '2026-01-01T00:00:00.000Z');

-- Allowed org units per seat (LEO & LORE covers both SCOPE and SCORE)
INSERT OR IGNORE INTO seat_allowed_units (seat_code, org_unit_id) VALUES
  ('PRES', 'EB'),
  ('VP', 'EB'),
  ('SecGen', 'EB'),
  ('TREAS', 'EB'),
  ('LPO', 'SCOPH'),
  ('LORP', 'SCORP'),
  ('LOME', 'SCOME'),
  ('LORA', 'SCORA'),
  ('LEO & LORE', 'SCOPE'),
  ('LEO & LORE', 'SCORE'),
  ('CBSDD', 'CBSDD'),
  ('PSDD', 'PSDD'),
  ('PNSDD', 'PNSDD'),
  ('RSDD', 'RSDD');
