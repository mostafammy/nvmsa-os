export * from './committees';
export * from './divisions';
export * from './roles';

import { STANDING_COMMITTEES } from './committees';
import { SUPPORT_DIVISIONS } from './divisions';

export const NVMSA_ENTITIES = [...STANDING_COMMITTEES, ...SUPPORT_DIVISIONS] as const;

export type NvmsaEntityCode = (typeof NVMSA_ENTITIES)[number]['code'];

export const NVMSA_ENTITY_CODES = NVMSA_ENTITIES.map((entity) => entity.code) as [
  NvmsaEntityCode,
  ...NvmsaEntityCode[],
];

export const NVMSA_ENTITY_MAP = Object.fromEntries(
  NVMSA_ENTITIES.map((entity) => [entity.code, entity]),
) as Record<NvmsaEntityCode, (typeof NVMSA_ENTITIES)[number]>;
