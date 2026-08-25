import {
  createParamDecorator,
  InternalServerErrorException,
  type ExecutionContext,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { User } from '../generated/prisma/client';
import type { AuthenticatedRequest } from './jwt-auth.guard';

// Resolver parameter decorator: injects the user attached by JwtAuthGuard.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const request = GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
    }>().req;
    if (!request.user) {
      // Only reachable if the decorator is used without JwtAuthGuard.
      throw new InternalServerErrorException(
        'CurrentUser used without JwtAuthGuard',
      );
    }
    return request.user;
  },
);
