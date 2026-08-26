/**
 * Development seed: creates an ADMIN user, a regular USER, three campaigns and
 * a handful of donations. Run with `npm run prisma:seed`.
 *
 * Idempotent: every record has a fixed id (or unique email) and is upserted,
 * so re-running restores the seeded records to this state without duplicating
 * them and without touching other data. Campaign totals are recomputed from
 * the donations actually in the database, so they always stay consistent.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import {
  CampaignStatus,
  Prisma,
  PrismaClient,
  Role,
} from '../src/generated/prisma/client';

// Development-only credentials. Never reuse these outside local development.
export const SEED_USERS = {
  admin: {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Admin',
    email: 'admin@charityhub.dev',
    password: 'Admin123!',
    role: Role.ADMIN,
  },
  user: {
    id: 'a0000000-0000-4000-8000-000000000002',
    name: 'Jane Donor',
    email: 'user@charityhub.dev',
    password: 'User1234!',
    role: Role.USER,
  },
} as const;

const CAMPAIGN_IDS = {
  water: 'c0000000-0000-4000-8000-000000000001',
  school: 'c0000000-0000-4000-8000-000000000002',
  shelter: 'c0000000-0000-4000-8000-000000000003',
} as const;

const SEED_CAMPAIGNS = [
  {
    id: CAMPAIGN_IDS.water,
    title: 'Clean Water for Rural Villages',
    description:
      'Drill and equip three deep-water wells serving roughly 2,400 people in ' +
      'villages that currently walk over an hour each day to fetch water.',
    targetAmount: '25000.00',
    status: CampaignStatus.ACTIVE,
  },
  {
    id: CAMPAIGN_IDS.school,
    title: 'School Supplies for 500 Children',
    description:
      'Backpacks, notebooks, and a full year of stationery for 500 primary ' +
      'school pupils from low-income families before the new term starts.',
    targetAmount: '10000.00',
    // Fully funded by the seeded donations, so it ends up COMPLETED.
    status: CampaignStatus.ACTIVE,
  },
  {
    id: CAMPAIGN_IDS.shelter,
    title: 'Emergency Winter Shelter',
    description:
      'Heated overnight shelter, warm meals, and blankets for people sleeping ' +
      'rough during the coldest months. Closed early after a municipal grant ' +
      'covered the remaining cost.',
    targetAmount: '50000.00',
    status: CampaignStatus.CLOSED,
  },
];

interface SeedDonation {
  id: string;
  campaignId: string;
  donor: 'admin' | 'user' | null; // null = guest donation
  donorName: string;
  amount: string;
  daysAgo: number;
}

const SEED_DONATIONS: SeedDonation[] = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    campaignId: CAMPAIGN_IDS.water,
    donor: 'user',
    donorName: 'Jane Donor',
    amount: '5000.00',
    daysAgo: 12,
  },
  {
    id: 'd0000000-0000-4000-8000-000000000002',
    campaignId: CAMPAIGN_IDS.water,
    donor: null,
    donorName: 'Anonymous',
    amount: '2500.00',
    daysAgo: 9,
  },
  {
    id: 'd0000000-0000-4000-8000-000000000003',
    campaignId: CAMPAIGN_IDS.water,
    donor: 'admin',
    donorName: 'Admin',
    amount: '1200.00',
    daysAgo: 3,
  },
  {
    id: 'd0000000-0000-4000-8000-000000000004',
    campaignId: CAMPAIGN_IDS.school,
    donor: 'user',
    donorName: 'Jane Donor',
    amount: '4000.00',
    daysAgo: 20,
  },
  {
    id: 'd0000000-0000-4000-8000-000000000005',
    campaignId: CAMPAIGN_IDS.school,
    donor: null,
    donorName: 'Riverside Bakery',
    amount: '3500.00',
    daysAgo: 15,
  },
  {
    id: 'd0000000-0000-4000-8000-000000000006',
    campaignId: CAMPAIGN_IDS.school,
    donor: null,
    donorName: 'Anonymous',
    amount: '2500.00',
    daysAgo: 14,
  },
  {
    id: 'd0000000-0000-4000-8000-000000000007',
    campaignId: CAMPAIGN_IDS.shelter,
    donor: 'user',
    donorName: 'Jane Donor',
    amount: '750.00',
    daysAgo: 30,
  },
];

const BCRYPT_ROUNDS = 10;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main(): Promise<void> {
  // Hash outside the transaction: bcrypt is deliberately slow.
  const passwordHashes = {
    admin: await bcrypt.hash(SEED_USERS.admin.password, BCRYPT_ROUNDS),
    user: await bcrypt.hash(SEED_USERS.user.password, BCRYPT_ROUNDS),
  };

  await prisma.$transaction(async (tx) => {
    // Users: matched by unique email so an account registered through the API
    // with the same email is updated rather than duplicated.
    const userIds: Record<'admin' | 'user', string> = { admin: '', user: '' };
    for (const key of ['admin', 'user'] as const) {
      const seed = SEED_USERS[key];
      const user = await tx.user.upsert({
        where: { email: seed.email },
        create: {
          id: seed.id,
          name: seed.name,
          email: seed.email,
          passwordHash: passwordHashes[key],
          role: seed.role,
        },
        update: {
          name: seed.name,
          passwordHash: passwordHashes[key],
          role: seed.role,
        },
      });
      userIds[key] = user.id;
    }

    for (const campaign of SEED_CAMPAIGNS) {
      const data = {
        title: campaign.title,
        description: campaign.description,
        targetAmount: new Prisma.Decimal(campaign.targetAmount),
        status: campaign.status,
      };
      await tx.campaign.upsert({
        where: { id: campaign.id },
        create: { id: campaign.id, ...data },
        update: data,
      });
    }

    for (const donation of SEED_DONATIONS) {
      const data = {
        amount: new Prisma.Decimal(donation.amount),
        donorName: donation.donorName,
        campaignId: donation.campaignId,
        userId: donation.donor ? userIds[donation.donor] : null,
        createdAt: daysAgo(donation.daysAgo),
      };
      await tx.donation.upsert({
        where: { id: donation.id },
        create: { id: donation.id, ...data },
        update: data,
      });
    }

    // Keep collectedAmount/status consistent with the donations that exist.
    for (const campaign of SEED_CAMPAIGNS) {
      const { _sum } = await tx.donation.aggregate({
        where: { campaignId: campaign.id },
        _sum: { amount: true },
      });
      const collectedAmount = _sum.amount ?? new Prisma.Decimal(0);
      const status = collectedAmount.greaterThanOrEqualTo(
        new Prisma.Decimal(campaign.targetAmount),
      )
        ? CampaignStatus.COMPLETED
        : campaign.status;
      await tx.campaign.update({
        where: { id: campaign.id },
        data: { collectedAmount, status },
      });
    }
  });

  const [users, campaigns, donations] = await Promise.all([
    prisma.user.count(),
    prisma.campaign.count(),
    prisma.donation.count(),
  ]);
  console.log('Seed complete.');
  console.log(`  users:     ${users}`);
  console.log(`  campaigns: ${campaigns}`);
  console.log(`  donations: ${donations}`);
  console.log('Development accounts:');
  console.log(
    `  ADMIN  ${SEED_USERS.admin.email} / ${SEED_USERS.admin.password}`,
  );
  console.log(
    `  USER   ${SEED_USERS.user.email} / ${SEED_USERS.user.password}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
