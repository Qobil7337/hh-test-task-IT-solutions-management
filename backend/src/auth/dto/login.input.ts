import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field(() => String)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
