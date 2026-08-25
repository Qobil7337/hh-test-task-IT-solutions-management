import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Application health status' })
export class Health {
  @Field(() => String, { description: 'Overall application status' })
  status!: string;

  @Field(() => String, { description: 'PostgreSQL connectivity: up or down' })
  database!: string;

  @Field(() => String, { description: 'ISO-8601 timestamp of the check' })
  timestamp!: string;
}
