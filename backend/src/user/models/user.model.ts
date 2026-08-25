import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Role } from '../../generated/prisma/client';

registerEnumType(Role, {
  name: 'Role',
  description: 'User role',
});

// passwordHash is deliberately absent: it must never leave the server.
@ObjectType({ description: 'A registered user' })
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  email!: string;

  @Field(() => Role)
  role!: Role;

  @Field(() => Date)
  createdAt!: Date;
}
