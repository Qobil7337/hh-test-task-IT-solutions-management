import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from './../src/generated/prisma/client';
import { PrismaService } from './../src/prisma/prisma.service';

interface GraphQLResponseBody {
  data?: Record<string, { id?: string } | Array<unknown> | null> | null;
  errors?: Array<{ message: string }>;
}

describe('Role-based authorization (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const adminEmail = `authz-admin-${suffix}@example.com`;
  const userEmail = `authz-user-${suffix}@example.com`;
  const password = 'authz-test-password';

  let adminToken: string;
  let userToken: string;
  let campaignId: string;

  const gql = async (
    query: string,
    token?: string,
  ): Promise<GraphQLResponseBody> => {
    const req = request(app.getHttpServer()).post('/graphql');
    if (token) {
      void req.set('Authorization', `Bearer ${token}`);
    }
    const res = await req.send({ query }).expect(200);
    return res.body as GraphQLResponseBody;
  };

  const register = async (email: string): Promise<string> => {
    const body = await gql(
      `mutation { register(input: { name: "Authz", email: "${email}", password: "${password}" }) { accessToken } }`,
    );
    return (body.data as { register: { accessToken: string } }).register
      .accessToken;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    userToken = await register(userEmail);
    adminToken = await register(adminEmail);
    // Admins are provisioned out-of-band; promote directly in the database.
    // The guard reads the role fresh from the DB, so the old token works.
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: Role.ADMIN },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.donation.deleteMany({
      where: { user: { email: { in: [adminEmail, userEmail] } } },
    });
    if (campaignId) {
      await prisma.donation.deleteMany({ where: { campaignId } });
      await prisma.campaign.deleteMany({ where: { id: campaignId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, userEmail] } },
    });
    await app.close();
  });

  const createCampaignMutation = `mutation { createCampaign(input: {
    title: "Authz campaign", description: "e2e", targetAmount: "1000.00" }) { id } }`;

  describe('unauthenticated access', () => {
    it('cannot create a campaign', async () => {
      const body = await gql(createCampaignMutation);
      expect(body.errors?.[0].message).toBe('Missing access token');
    });

    it('cannot create a donation', async () => {
      const body = await gql(
        `mutation { createDonation(input: { campaignId: "9f4a1f8e-6d3b-4a6e-9c1d-2f5b8a7c3e10", amount: "10.00", donorName: "X" }) { id } }`,
      );
      expect(body.errors?.[0].message).toBe('Missing access token');
    });

    it('cannot read a donation history', async () => {
      const body = await gql(`{ myDonations { id } }`);
      expect(body.errors?.[0].message).toBe('Missing access token');
    });

    it('can still view campaigns (public read)', async () => {
      const body = await gql(`{ campaigns { id } }`);
      expect(body.errors).toBeUndefined();
    });
  });

  describe('regular user access', () => {
    it('cannot create a campaign', async () => {
      const body = await gql(createCampaignMutation, userToken);
      expect(body.errors?.[0].message).toBe('Requires ADMIN role');
    });

    it('cannot update, close, or delete a campaign', async () => {
      for (const mutation of [
        `mutation { updateCampaign(id: "9f4a1f8e-6d3b-4a6e-9c1d-2f5b8a7c3e10", input: { title: "x" }) { id } }`,
        `mutation { closeCampaign(id: "9f4a1f8e-6d3b-4a6e-9c1d-2f5b8a7c3e10") { id } }`,
        `mutation { deleteCampaign(id: "9f4a1f8e-6d3b-4a6e-9c1d-2f5b8a7c3e10") { id } }`,
      ]) {
        const body = await gql(mutation, userToken);
        expect(body.errors?.[0].message).toBe('Requires ADMIN role');
      }
    });

    it('can view campaigns', async () => {
      const body = await gql(`{ campaigns { id } }`, userToken);
      expect(body.errors).toBeUndefined();
    });
  });

  describe('admin access', () => {
    it('can create a campaign', async () => {
      const body = await gql(createCampaignMutation, adminToken);
      expect(body.errors).toBeUndefined();
      campaignId = (body.data as { createCampaign: { id: string } })
        .createCampaign.id;
      expect(campaignId).toBeTruthy();
    });

    it('can update the campaign', async () => {
      const body = await gql(
        `mutation { updateCampaign(id: "${campaignId}", input: { title: "Updated by admin" }) { id } }`,
        adminToken,
      );
      expect(body.errors).toBeUndefined();
    });
  });

  describe('regular user donations', () => {
    it('can donate to the campaign and sees it in myDonations', async () => {
      const donate = await gql(
        `mutation { createDonation(input: { campaignId: "${campaignId}", amount: "10.00", donorName: "Authz User" }) { id userId } }`,
        userToken,
      );
      expect(donate.errors).toBeUndefined();

      const history = await gql(`{ myDonations { id amount } }`, userToken);
      expect(history.errors).toBeUndefined();
      expect(
        (history.data as { myDonations: unknown[] }).myDonations,
      ).toHaveLength(1);

      // The other account's history stays empty: it is per-user.
      const adminHistory = await gql(`{ myDonations { id } }`, adminToken);
      expect(
        (adminHistory.data as { myDonations: unknown[] }).myDonations,
      ).toHaveLength(0);
    });
  });
});
