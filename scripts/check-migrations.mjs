import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const baseline = readFileSync(join(process.cwd(), 'drizzle', '0000_baseline.sql'), 'utf8');
const seed = readFileSync(join(process.cwd(), 'drizzle', '0001_seed_nvmsa.sql'), 'utf8');

const EXPECTED_UNITS = [
  'SCOPH',
  'SCORP',
  'SCOME',
  'SCORA',
  'SCOPE',
  'SCORE',
  'CBSDD',
  'PSDD',
  'PNSDD',
  'RSDD',
  'EB',
];

const EXPECTED_SEATS = [
  'PRES',
  'VP',
  'SecGen',
  'TREAS',
  'LPO',
  'LORP',
  'LOME',
  'LORA',
  'LEO & LORE',
  'CBSDD',
  'PSDD',
  'PNSDD',
  'RSDD',
];

const FORBIDDEN_LEGACY = ['calendar_slots', 'calendar_slot_audit_logs', 'FSDD', "'CBDD'"];

const errors = [];

if (!baseline.includes('uq_active_post_date')) {
  errors.push('Missing uq_active_post_date partial unique index in 0000_baseline.sql');
}
if (!baseline.includes('last_mutation_id')) {
  errors.push('Missing last_mutation_id nonce column in post_slots');
}
if (!seed.includes('lpoo.nvmsa@gmail.com')) {
  errors.push('Missing canonical lpoo.nvmsa@gmail.com email for LPO seat');
}

for (const unit of EXPECTED_UNITS) {
  if (!seed.includes(`'${unit}'`)) {
    errors.push(`Missing seeded org_unit: ${unit}`);
  }
}

for (const seat of EXPECTED_SEATS) {
  if (!seed.includes(`'${seat}'`)) {
    errors.push(`Missing seeded office_seat: ${seat}`);
  }
}

for (const legacy of FORBIDDEN_LEGACY) {
  if (baseline.includes(legacy) || seed.includes(legacy)) {
    errors.push(`Forbidden legacy reference found in migrations: ${legacy}`);
  }
}

if (errors.length > 0) {
  console.error('Migration verification failed:\n' + errors.map((e) => `- ${e}`).join('\n'));
  process.exit(1);
}

console.log('Migration check passed (11 org_units, 13 office_seats, uq_active_post_date verified).');
