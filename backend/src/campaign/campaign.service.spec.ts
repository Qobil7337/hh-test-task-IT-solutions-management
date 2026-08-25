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
import { CampaignService } from './campaign.service';

const CAMPAIGN_ID = '9f4a1f8e-6d3b-4a6e-9c1d-2f5b8a7c3e10';

function buildCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: CAMPAIGN_ID,
    title: 'Clean water wells',
    description: 'Build wells in rural areas',
    targetAmount: new Prisma.Decimal('1000.00'),
    collectedAmount: new Prisma.Decimal('0.00'),
    status: CampaignStatus.ACTIVE,
    createdAt: new Date('2026-08-25T10:00:00Z'),
    updatedAt: new Date('2026-08-25T10:00:00Z'),
    ...overrides,
  };
}

describe('CampaignService', () => {
  let service: CampaignService;
  let prisma: {
    campaign: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      campaign: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(CampaignService);
  });

  describe('findAll', () => {
    it('lists campaigns newest first', async () => {
      const campaigns = [buildCampaign()];
      prisma.campaign.findMany.mockResolvedValue(campaigns);

      await expect(service.findAll()).resolves.toBe(campaigns);
      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the campaign when it exists', async () => {
      const campaign = buildCampaign();
      prisma.campaign.findUnique.mockResolvedValue(campaign);

      await expect(service.findOne(CAMPAIGN_ID)).resolves.toBe(campaign);
    });

    it('throws NotFoundException when the campaign does not exist', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.findOne(CAMPAIGN_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('stores the target amount as an exact Decimal', async () => {
      prisma.campaign.create.mockResolvedValue(buildCampaign());

      await service.create({
        title: 'Clean water wells',
        description: 'Build wells in rural areas',
        targetAmount: '1000.50',
      });

      const data = (
        prisma.campaign.create.mock.calls[0] as [
          { data: Prisma.CampaignCreateInput },
        ]
      )[0].data;
      const storedAmount = data.targetAmount as Prisma.Decimal;
      expect(storedAmount).toBeInstanceOf(Prisma.Decimal);
      expect(storedAmount.toString()).toBe('1000.5');
    });

    it.each(['0', '0.00', '-10'])(
      'rejects non-positive target amount %s',
      async (targetAmount) => {
        await expect(
          service.create({ title: 't', description: 'd', targetAmount }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.campaign.create).not.toHaveBeenCalled();
      },
    );

    it('rejects a malformed target amount', async () => {
      await expect(
        service.create({ title: 't', description: 'd', targetAmount: 'abc' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.campaign.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the campaign does not exist', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        service.update(CAMPAIGN_ID, { title: 'New title' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it.each([CampaignStatus.COMPLETED, CampaignStatus.CLOSED])(
      'rejects updates to a %s campaign',
      async (status) => {
        prisma.campaign.findUnique.mockResolvedValue(buildCampaign({ status }));

        await expect(
          service.update(CAMPAIGN_ID, { title: 'New title' }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.campaign.update).not.toHaveBeenCalled();
      },
    );

    it('updates only the provided fields and never touches status or collectedAmount', async () => {
      prisma.campaign.findUnique.mockResolvedValue(buildCampaign());
      prisma.campaign.update.mockResolvedValue(buildCampaign());

      await service.update(CAMPAIGN_ID, { title: 'New title' });

      const args = (
        prisma.campaign.update.mock.calls[0] as [
          { where: { id: string }; data: Prisma.CampaignUpdateInput },
        ]
      )[0];
      expect(args.where).toEqual({ id: CAMPAIGN_ID });
      expect(Object.keys(args.data)).toEqual(['title']);
    });

    it('rejects a non-positive target amount', async () => {
      prisma.campaign.findUnique.mockResolvedValue(buildCampaign());

      await expect(
        service.update(CAMPAIGN_ID, { targetAmount: '0' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.campaign.update).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('closes an active campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue(buildCampaign());
      prisma.campaign.update.mockResolvedValue(
        buildCampaign({ status: CampaignStatus.CLOSED }),
      );

      const result = await service.close(CAMPAIGN_ID);

      expect(result.status).toBe(CampaignStatus.CLOSED);
      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: CAMPAIGN_ID },
        data: { status: CampaignStatus.CLOSED },
      });
    });

    it.each([CampaignStatus.COMPLETED, CampaignStatus.CLOSED])(
      'rejects closing a %s campaign',
      async (status) => {
        prisma.campaign.findUnique.mockResolvedValue(buildCampaign({ status }));

        await expect(service.close(CAMPAIGN_ID)).rejects.toBeInstanceOf(
          ConflictException,
        );
        expect(prisma.campaign.update).not.toHaveBeenCalled();
      },
    );
  });

  describe('delete', () => {
    it('throws NotFoundException when the campaign does not exist', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.delete(CAMPAIGN_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.campaign.delete).not.toHaveBeenCalled();
    });

    it('deletes a campaign without donations', async () => {
      const campaign = buildCampaign();
      prisma.campaign.findUnique.mockResolvedValue(campaign);
      prisma.campaign.delete.mockResolvedValue(campaign);

      await expect(service.delete(CAMPAIGN_ID)).resolves.toBe(campaign);
    });

    it('maps a foreign key violation to ConflictException', async () => {
      prisma.campaign.findUnique.mockResolvedValue(buildCampaign());
      prisma.campaign.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint violated',
          { code: 'P2003', clientVersion: '7.9.1' },
        ),
      );

      await expect(service.delete(CAMPAIGN_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
