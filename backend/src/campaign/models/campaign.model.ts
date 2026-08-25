import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CampaignStatus, type Prisma } from '../../generated/prisma/client';

registerEnumType(CampaignStatus, {
  name: 'CampaignStatus',
  description: 'Lifecycle status of a campaign',
});

@ObjectType({ description: 'A charity fundraising campaign' })
export class Campaign {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  description!: string;

  // Monetary values are exposed as exact decimal strings (e.g. "1000.00")
  // to avoid floating-point precision loss in transport.
  @Field(() => String, { description: 'Decimal string, e.g. "1000.00"' })
  targetAmount!: Prisma.Decimal;

  @Field(() => String, { description: 'Decimal string, e.g. "250.00"' })
  collectedAmount!: Prisma.Decimal;

  @Field(() => CampaignStatus)
  status!: CampaignStatus;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
