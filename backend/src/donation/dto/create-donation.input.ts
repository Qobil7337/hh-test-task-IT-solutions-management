import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { DECIMAL_AMOUNT_REGEX } from '../../common/money';

// No userId here: once authentication exists it will be taken from the
// authenticated user, never supplied by the client.
@InputType()
export class CreateDonationInput {
  @Field(() => ID)
  @IsUUID()
  campaignId!: string;

  @Field(() => String, { description: 'Decimal string, e.g. "50.00"' })
  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: 'amount must be a decimal number with at most 2 fraction digits',
  })
  amount!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  donorName!: string;
}
