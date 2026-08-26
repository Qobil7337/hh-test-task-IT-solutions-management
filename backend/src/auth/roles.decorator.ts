import { SetMetadata } from '@nestjs/common';
import type { Role } from '../generated/prisma/client';

export const ROLES_KEY = 'roles';

// Declares which roles may execute the decorated operation.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
