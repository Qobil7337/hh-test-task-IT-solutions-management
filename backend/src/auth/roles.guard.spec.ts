import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, type User } from '../generated/prisma/client';
import { RolesGuard } from './roles.guard';

function buildUser(role: Role): User {
  return {
    id: '9f4a1f8e-6d3b-4a6e-9c1d-2f5b8a7c3e10',
    name: 'Alice',
    email: 'alice@example.com',
    passwordHash: 'hash',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Minimal GraphQL execution context: GqlExecutionContext reads the request
// from the third GraphQL argument (the context object).
function buildContext(user?: User): ExecutionContext {
  return {
    getType: () => 'graphql',
    getHandler: () => ({}),
    getClass: () => ({}),
    getArgs: () => [{}, {}, { req: { headers: {}, user } }, {}],
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows any user when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(buildContext(undefined))).toBe(true);
  });

  it('allows an ADMIN where ADMIN is required', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(buildContext(buildUser(Role.ADMIN)))).toBe(true);
  });

  it('rejects a regular USER where ADMIN is required', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(buildContext(buildUser(Role.USER)))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects an unauthenticated request where a role is required', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});
