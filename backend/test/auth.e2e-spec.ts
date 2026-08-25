import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface GraphQLResponseBody {
  data?: {
    register?: { accessToken: string; user: AuthUser };
    login?: { accessToken: string };
    me?: AuthUser;
  } | null;
  errors?: Array<{ message: string }>;
}

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const email = `auth-e2e-${Date.now()}@example.com`;
  const password = 'super-secret-password';
  let accessToken: string;

  const gql = (query: string, token?: string) => {
    const req = request(app.getHttpServer()).post('/graphql');
    if (token) {
      void req.set('Authorization', `Bearer ${token}`);
    }
    return req.send({ query });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('registers a user and returns a JWT', async () => {
    const res = await gql(
      `mutation { register(input: { name: "E2E User", email: "${email}", password: "${password}" }) {
        accessToken user { id email role } } }`,
    ).expect(200);

    const body = res.body as GraphQLResponseBody;
    expect(body.errors).toBeUndefined();
    expect(body.data?.register?.accessToken).toBeTruthy();
    expect(body.data?.register?.user.email).toBe(email);
    expect(body.data?.register?.user.role).toBe('USER');
  });

  it('logs in with valid credentials and returns a JWT', async () => {
    const res = await gql(
      `mutation { login(input: { email: "${email}", password: "${password}" }) { accessToken } }`,
    ).expect(200);

    const body = res.body as GraphQLResponseBody;
    expect(body.errors).toBeUndefined();
    accessToken = body.data?.login?.accessToken ?? '';
    expect(accessToken).toBeTruthy();
  });

  it('rejects a login with an invalid password', async () => {
    const res = await gql(
      `mutation { login(input: { email: "${email}", password: "wrong-password" }) { accessToken } }`,
    ).expect(200);

    const body = res.body as GraphQLResponseBody;
    expect(body.errors?.[0].message).toBe('Invalid email or password');
  });

  it('rejects a login for an unknown user with the same error', async () => {
    const res = await gql(
      `mutation { login(input: { email: "unknown-${email}", password: "${password}" }) { accessToken } }`,
    ).expect(200);

    const body = res.body as GraphQLResponseBody;
    expect(body.errors?.[0].message).toBe('Invalid email or password');
  });

  it('rejects the protected me query without a token', async () => {
    const res = await gql(`{ me { id email } }`).expect(200);

    const body = res.body as GraphQLResponseBody;
    expect(body.data ?? null).toBeNull();
    expect(body.errors?.[0].message).toBe('Missing access token');
  });

  it('rejects the protected me query with a malformed token', async () => {
    const res = await gql(`{ me { id email } }`, 'not-a-jwt').expect(200);

    const body = res.body as GraphQLResponseBody;
    expect(body.errors?.[0].message).toBe('Invalid or expired access token');
  });

  it('returns the current user for a valid token', async () => {
    const res = await gql(`{ me { id email role } }`, accessToken).expect(200);

    const body = res.body as GraphQLResponseBody;
    expect(body.errors).toBeUndefined();
    expect(body.data?.me?.email).toBe(email);
  });

  it('rejects registering the same email twice', async () => {
    const res = await gql(
      `mutation { register(input: { name: "Dup", email: "${email}", password: "${password}" }) { accessToken } }`,
    ).expect(200);

    const body = res.body as GraphQLResponseBody;
    expect(body.errors?.[0].message).toBe('Email is already registered');
  });
});
