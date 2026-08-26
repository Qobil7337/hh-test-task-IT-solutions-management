import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CampaignStatus,
  Prisma,
  type Campaign,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DonationService } from './donation.service';

const CAMPAIGN_ID = '9f4a1f8e-6d3b-4a6e-9c1d-2f5b8a7c3e10';

function buildCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: CAMPAIGN_ID,
    title: 'Clean water wells',
    description: 'Build wells in rural areas',
    targetAmount: new Prisma.Decimal('10000.00'),
    collectedAmount: new Prisma.Decimal('9800.00'),
    status: CampaignStatus.ACTIVE,
    createdAt: new Date('2026-08-25T10:00:00Z'),
    updatedAt: new Date('2026-08-25T10:00:00Z'),
    ...overrides,
  };
}

function buildInput(amount: string) {
  return { campaignId: CAMPAIGN_ID, amount, donorName: 'Alex' };
}

describe('DonationService', () => {
  let service: DonationService;
  let tx: {
    $queryRaw: jest.Mock;
    campaign: { findUnique: jest.Mock; update: jest.Mock };
    donation: { create: jest.Mock };
  };
  let prisma: {
    $transaction: jest.Mock;
    campaign: { findUnique: jest.Mock };
    donation: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: CAMPAIGN_ID }]),
      campaign: { findUnique: jest.fn(), update: jest.fn() },
      donation: { create: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
      campaign: { findUnique: jest.fn() },
      donation: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DonationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(DonationService);
  });

  describe('findByCampaign', () => {
    it('throws NotFoundException for an unknown campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.findByCampaign(CAMPAIGN_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lists donations of the campaign, newest first', async () => {
      prisma.campaign.findUnique.mockResolvedValue({ id: CAMPAIGN_ID });
      const donations = [{ id: 'd1' }];
      prisma.donation.findMany.mockResolvedValue(donations);

      await expect(service.findByCampaign(CAMPAIGN_ID)).resolves.toBe(
        donations,
      );
      expect(prisma.donation.findMany).toHaveBeenCalledWith({
        where: { campaignId: CAMPAIGN_ID },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('accepts a donation and updates collectedAmount without touching status', async () => {
      tx.campaign.findUnique.mockResolvedValue(
        buildCampaign({ collectedAmount: new Prisma.Decimal('100.00') }),
      );
      const donation = { id: 'd1' };
      tx.donation.create.mockResolvedValue(donation);
      tx.campaign.update.mockResolvedValue(buildCampaign());

      await expect(service.create(buildInput('50.00'))).resolves.toBe(donation);

      const createArgs = (
        tx.donation.create.mock.calls[0] as [
          {
            data: {
              amount: Prisma.Decimal;
              donorName: string;
              userId: string | null;
            };
          },
        ]
      )[0];
      expect(createArgs.data.amount.toString()).toBe('50');
      expect(createArgs.data.donorName).toBe('Alex');
      expect(createArgs.data.userId).toBeNull();

      const updateArgs = (
        tx.campaign.update.mock.calls[0] as [
          { data: Prisma.CampaignUpdateInput },
        ]
      )[0];
      expect(Object.keys(updateArgs.data)).toEqual(['collectedAmount']);
      expect(
        (updateArgs.data.collectedAmount as Prisma.Decimal).toString(),
      ).toBe('150');
    });

    it('attaches the donating user when a userId is provided', async () => {
      tx.campaign.findUnique.mockResolvedValue(
        buildCampaign({ collectedAmount: new Prisma.Decimal('100.00') }),
      );
      tx.donation.create.mockResolvedValue({ id: 'd1' });
      tx.campaign.update.mockResolvedValue(buildCampaign());

      const userId = '2c9a0e6b-1f4d-4b7a-8e3c-5d6f7a8b9c0d';
      await service.create(buildInput('50.00'), userId);

      const createArgs = (
        tx.donation.create.mock.calls[0] as [
          { data: { userId: string | null } },
        ]
      )[0];
      expect(createArgs.data.userId).toBe(userId);
    });

    it.each(['0', '0.00', '-5'])(
      'rejects non-positive amount %s before opening a transaction',
      async (amount) => {
        await expect(service.create(buildInput(amount))).rejects.toBeInstanceOf(
          BadRequestException,
        );
        expect(prisma.$transaction).not.toHaveBeenCalled();
      },
    );

    it('rejects a malformed amount', async () => {
      await expect(service.create(buildInput('abc'))).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown campaign', async () => {
      tx.campaign.findUnique.mockResolvedValue(null);

      await expect(service.create(buildInput('50.00'))).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(tx.donation.create).not.toHaveBeenCalled();
    });

    it.each([CampaignStatus.CLOSED, CampaignStatus.COMPLETED])(
      'rejects donations to a %s campaign',
      async (status) => {
        tx.campaign.findUnique.mockResolvedValue(buildCampaign({ status }));

        await expect(
          service.create(buildInput('50.00')),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(tx.donation.create).not.toHaveBeenCalled();
      },
    );

    it('rejects the entire donation when it exceeds the remaining amount', async () => {
      // Target 10000, collected 9800 — a 500 donation must be rejected whole.
      tx.campaign.findUnique.mockResolvedValue(buildCampaign());

      await expect(service.create(buildInput('500.00'))).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.donation.create).not.toHaveBeenCalled();
      expect(tx.campaign.update).not.toHaveBeenCalled();
    });

    it('marks the campaign COMPLETED when the donation reaches the target', async () => {
      // Target 10000, collected 9800 — a 200 donation completes the campaign.
      tx.campaign.findUnique.mockResolvedValue(buildCampaign());
      tx.donation.create.mockResolvedValue({ id: 'd1' });
      tx.campaign.update.mockResolvedValue(
        buildCampaign({ status: CampaignStatus.COMPLETED }),
      );

      await service.create(buildInput('200.00'));

      const updateArgs = (
        tx.campaign.update.mock.calls[0] as [
          { data: Prisma.CampaignUpdateInput },
        ]
      )[0];
      expect(updateArgs.data.status).toBe(CampaignStatus.COMPLETED);
      expect(
        (updateArgs.data.collectedAmount as Prisma.Decimal).toString(),
      ).toBe('10000');
    });

    it('re-checks the committed state after acquiring the lock (concurrent scenario)', async () => {
      // Two donations of 200 race for the last 200 of the target.
      // The second transaction only proceeds after the first commits, and its
      // post-lock read sees collectedAmount already at 10000.
      tx.campaign.findUnique
        .mockResolvedValueOnce(buildCampaign())
        .mockResolvedValueOnce(
          buildCampaign({
            collectedAmount: new Prisma.Decimal('10000.00'),
            status: CampaignStatus.COMPLETED,
          }),
        );
      tx.donation.create.mockResolvedValue({ id: 'd1' });
      tx.campaign.update.mockResolvedValue(buildCampaign());

      await expect(service.create(buildInput('200.00'))).resolves.toBeDefined();
      await expect(service.create(buildInput('200.00'))).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.donation.create).toHaveBeenCalledTimes(1);
    });
  });
});
