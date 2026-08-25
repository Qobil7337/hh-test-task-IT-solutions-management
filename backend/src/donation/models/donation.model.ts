import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Prisma } from '../../generated/prisma/client';

@ObjectType({ description: 'A donation made to a campaign' })
export class Donation {
  @Field(() => ID)
  id!: string;

  @Field(() => String, { description: 'Decimal string, e.g. "50.00"' })
  amount!: Prisma.Decimal;

  @Field(() => String)
  donorName!: string;

  @Field(() => ID)
  campaignId!: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Set once authenticated donations exist; null for guests',
  })
  userId!: string | null;

  @Field(() => Date)
  createdAt!: Date;
}
