import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { parsePositiveDecimal } from '../common/money';
import { CampaignStatus, type Donation } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonationInput } from './dto/create-donation.input';

@Injectable()
export class DonationService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCampaign(campaignId: string): Promise<Donation[]> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    return this.prisma.donation.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUser(userId: string): Promise<Donation[]> {
    return this.prisma.donation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateDonationInput, userId?: string): Promise<Donation> {
    const amount = parsePositiveDecimal(input.amount, 'amount');

    return this.prisma.$transaction(async (tx) => {
      // Serialize concurrent donations per campaign: the row lock makes every
      // competing transaction wait here and then re-read the *committed* state.
      await tx.$queryRaw`SELECT id FROM "campaigns" WHERE id = ${input.campaignId}::uuid FOR UPDATE`;

      const campaign = await tx.campaign.findUnique({
        where: { id: input.campaignId },
      });
      if (!campaign) {
        throw new NotFoundException(`Campaign ${input.campaignId} not found`);
      }
      if (campaign.status !== CampaignStatus.ACTIVE) {
        throw new ConflictException(
          `Campaign ${campaign.id} is not active and cannot accept donations`,
        );
      }

      const remaining = campaign.targetAmount.minus(campaign.collectedAmount);
      if (amount.greaterThan(remaining)) {
        throw new ConflictException(
          `Donation of ${amount.toFixed(2)} exceeds the remaining amount of ${remaining.toFixed(2)}`,
        );
      }

      const donation = await tx.donation.create({
        data: {
          amount,
          donorName: input.donorName,
          campaignId: campaign.id,
          userId: userId ?? null,
        },
      });

      const collectedAmount = campaign.collectedAmount.plus(amount);
      await tx.campaign.update({
        where: { id: campaign.id },
        data: {
          collectedAmount,
          // The exceed-check above caps collectedAmount at targetAmount,
          // so reaching the target is exactly equality.
          ...(collectedAmount.equals(campaign.targetAmount)
            ? { status: CampaignStatus.COMPLETED }
            : {}),
        },
      });

      return donation;
    });
  }
}
