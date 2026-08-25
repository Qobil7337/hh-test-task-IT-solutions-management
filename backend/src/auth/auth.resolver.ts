import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { User as UserEntity } from '../generated/prisma/client';
import { User } from '../user/models/user.model';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthPayload } from './models/auth-payload.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload, {
    description: 'Create an account and receive an access token',
  })
  register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  @Mutation(() => AuthPayload, {
    description: 'Log in with email and password',
  })
  login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Query(() => User, { description: 'The currently authenticated user' })
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: UserEntity): UserEntity {
    return user;
  }
}
