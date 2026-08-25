import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import {
  validateEnv,
  type EnvironmentVariables,
} from './config/env.validation';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => {
        const isProduction =
          configService.get('NODE_ENV', { infer: true }) === 'production';

        return {
          autoSchemaFile: join(process.cwd(), 'src', 'schema.gql'),
          sortSchema: true,
          introspection: !isProduction,
          playground: false,
          plugins: isProduction
            ? []
            : [ApolloServerPluginLandingPageLocalDefault()],
        };
      },
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
