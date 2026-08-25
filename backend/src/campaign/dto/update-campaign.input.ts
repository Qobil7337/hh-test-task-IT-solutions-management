import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DECIMAL_AMOUNT_REGEX } from '../../common/money';

// Deliberately excludes `status` (changed via closeCampaign / donations) and
// `collectedAmount` (maintained by the donation flow, never set manually).
@InputType()
export class UpdateCampaignInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Decimal string, e.g. "1000.00"',
  })
  @IsOptional()
  @Matches(DECIMAL_AMOUNT_REGEX, {
    message:
      'targetAmount must be a decimal number with at most 2 fraction digits',
  })
  targetAmount?: string;
}
