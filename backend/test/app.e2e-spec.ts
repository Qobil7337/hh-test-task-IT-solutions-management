import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface HealthQueryResponse {
  data: {
    health: {
      status: string;
      database: string;
      timestamp: string;
    };
  };
}

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('health query returns ok', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ health { status database timestamp } }' })
      .expect(200);

    const body = response.body as HealthQueryResponse;
    expect(body.data.health.status).toBe('ok');
    expect(['up', 'down']).toContain(body.data.health.database);
    expect(new Date(body.data.health.timestamp).getTime()).not.toBeNaN();
  });
});
