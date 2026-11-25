import { z } from 'zod';
import { NVMSA_ENTITY_CODES, USER_ROLES } from '../constants';

export const UserRoleSchema = z.enum(USER_ROLES);

export const SessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  entityCode: z.enum(NVMSA_ENTITY_CODES).nullable().optional(),
});

export const SignInInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const SignUpInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
