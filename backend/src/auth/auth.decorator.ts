import { applyDecorators, UseGuards } from '@nestjs/common';
import type { Role } from '../generated/prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

/**
 * Protects a resolver operation:
 *   @Auth()            — any authenticated user
 *   @Auth(Role.ADMIN)  — authenticated user with one of the given roles
 *
 * Composes JwtAuthGuard (authentication) and RolesGuard (authorization) so
 * resolvers never repeat guard/role wiring.
 */
export function Auth(...roles: Role[]) {
  return applyDecorators(Roles(...roles), UseGuards(JwtAuthGuard, RolesGuard));
}
