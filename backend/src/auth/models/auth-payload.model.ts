import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';

@ObjectType({ description: 'Result of a successful registration or login' })
export class AuthPayload {
  @Field(() => String, { description: 'JWT access token (Bearer)' })
  accessToken!: string;

  @Field(() => User)
  user!: User;
}
