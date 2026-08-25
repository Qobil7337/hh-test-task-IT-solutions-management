import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { DonationService } from './../src/donation/donation.service';
import { CampaignStatus, Prisma } from './../src/generated/prisma/client';
import { PrismaService } from './../src/prisma/prisma.service';

// Runs against the real PostgreSQL from docker-compose: this is the actual
// concurrency guarantee, not a mock of it.
describe('Donation concurrency (e2e)', () => {
  let app: INestApplication;
  let donationService: DonationService;
  let prisma: PrismaService;
  let campaignId: string | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    donationService = app.get(DonationService);
    prisma = app.get(PrismaService);
  }, 30000);

  afterAll(async () => {
    if (campaignId) {
      await prisma.donation.deleteMany({ where: { campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
    await app.close();
  });

  it('never overshoots the target under concurrent donations', async () => {
    const campaign = await prisma.campaign.create({
      data: {
        title: 'Concurrency test campaign',
        description: 'Created by the e2e concurrency test',
        targetAmount: new Prisma.Decimal('100.00'),
      },
    });
    campaignId = campaign.id;

    // 10 concurrent donations of 25.00 against a target of 100.00:
    // exactly 4 can fit, the other 6 must be rejected.
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        donationService.create({
          campaignId: campaign.id,
          amount: '25.00',
          donorName: `Concurrent donor ${i + 1}`,
        }),
      ),
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(4);
    expect(rejected).toHaveLength(6);

    const finalCampaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaign.id },
    });
    expect(finalCampaign.collectedAmount.toString()).toBe('100');
    expect(finalCampaign.status).toBe(CampaignStatus.COMPLETED);

    await expect(
      prisma.donation.count({ where: { campaignId: campaign.id } }),
    ).resolves.toBe(4);
  }, 30000);

  it('rejects further donations once the campaign is completed', async () => {
    await expect(
      donationService.create({
        campaignId: campaignId as string,
        amount: '1.00',
        donorName: 'Late donor',
      }),
    ).rejects.toThrow(/not active/);
  }, 30000);
});
