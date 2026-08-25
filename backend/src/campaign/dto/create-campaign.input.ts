import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export const DECIMAL_AMOUNT_REGEX = /^\d{1,10}(\.\d{1,2})?$/;

@InputType()
export class CreateCampaignInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @Field(() => String, { description: 'Decimal string, e.g. "1000.00"' })
  @Matches(DECIMAL_AMOUNT_REGEX, {
    message:
      'targetAmount must be a decimal number with at most 2 fraction digits',
  })
  targetAmount!: string;
}
