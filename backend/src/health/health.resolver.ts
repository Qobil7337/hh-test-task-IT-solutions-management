import { Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';
import { Health } from './health.model';

@Resolver(() => Health)
export class HealthResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => Health, {
    description: 'Application liveness and database connectivity check',
  })
  async health(): Promise<Health> {
    let database = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    return {
      status: 'ok',
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
