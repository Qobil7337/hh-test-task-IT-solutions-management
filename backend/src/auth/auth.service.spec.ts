import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Role, type User } from '../generated/prisma/client';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

const PASSWORD = 'correct-horse-battery';

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let user: User;

  beforeAll(async () => {
    user = {
      id: '9f4a1f8e-6d3b-4a6e-9c1d-2f5b8a7c3e10',
      name: 'Alice',
      email: 'alice@example.com',
      passwordHash: await bcrypt.hash(PASSWORD, 4),
      role: Role.USER,
      createdAt: new Date('2026-08-25T10:00:00Z'),
      updatedAt: new Date('2026-08-25T10:00:00Z'),
    };
  });

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('login', () => {
    it('returns a JWT and the user for valid credentials', async () => {
      userService.findByEmail.mockResolvedValue(user);

      const result = await service.login({
        email: 'alice@example.com',
        password: PASSWORD,
      });

      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user).toBe(user);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
    });

    it('normalizes the email before the lookup', async () => {
      userService.findByEmail.mockResolvedValue(user);

      await service.login({
        email: '  Alice@Example.COM ',
        password: PASSWORD,
      });

      expect(userService.findByEmail).toHaveBeenCalledWith('alice@example.com');
    });

    it('rejects an invalid password', async () => {
      userService.findByEmail.mockResolvedValue(user);

      await expect(
        service.login({ email: 'alice@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects an unknown user with the same error as a wrong password', async () => {
      userService.findByEmail.mockResolvedValue(null);

      const unknownError = await service
        .login({ email: 'nobody@example.com', password: PASSWORD })
        .catch((e: Error) => e);
      userService.findByEmail.mockResolvedValue(user);
      const wrongPasswordError = await service
        .login({ email: 'alice@example.com', password: 'wrong' })
        .catch((e: Error) => e);

      expect(unknownError).toBeInstanceOf(UnauthorizedException);
      expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
      expect(unknownError.message).toBe(wrongPasswordError.message);
    });
  });

  describe('register', () => {
    it('stores a bcrypt hash, never the plaintext password', async () => {
      userService.create.mockResolvedValue(user);

      const result = await service.register({
        name: '  Alice  ',
        email: '  Alice@Example.COM ',
        password: PASSWORD,
      });

      const createArgs = (
        userService.create.mock.calls[0] as [
          { name: string; email: string; passwordHash: string },
        ]
      )[0];
      expect(createArgs.name).toBe('Alice');
      expect(createArgs.email).toBe('alice@example.com');
      expect(createArgs.passwordHash).not.toContain(PASSWORD);
      await expect(
        bcrypt.compare(PASSWORD, createArgs.passwordHash),
      ).resolves.toBe(true);
      expect(result.accessToken).toBe('signed-jwt');
    });
  });
});
