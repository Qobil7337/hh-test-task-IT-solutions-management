import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Role } from '../generated/prisma/client';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import { ROLES_KEY } from './roles.decorator';

// Runs after JwtAuthGuard (which attaches request.user) and checks the user's
// role — taken fresh from the database, not from the token — against the
// roles declared via @Roles().
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
    }>().req;
    if (!user) {
      throw new UnauthorizedException('Missing access token');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Requires ${requiredRoles.join(' or ')} role`,
      );
    }
    return true;
  }
}
