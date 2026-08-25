import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CampaignStatus,
  Prisma,
  type Campaign,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { UpdateCampaignInput } from './dto/update-campaign.input';

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    return campaign;
  }

  async create(input: CreateCampaignInput): Promise<Campaign> {
    return await this.prisma.campaign.create({
      data: {
        title: input.title,
        description: input.description,
        targetAmount: this.parseTargetAmount(input.targetAmount),
      },
    });
  }

  async update(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    const campaign = await this.findOne(id);
    this.assertModifiable(campaign);

    // Explicit whitelist: status and collectedAmount can never be set here.
    const data: Prisma.CampaignUpdateInput = {};
    if (input.title !== undefined) {
      data.title = input.title;
    }
    if (input.description !== undefined) {
      data.description = input.description;
    }
    if (input.targetAmount !== undefined) {
      data.targetAmount = this.parseTargetAmount(input.targetAmount);
    }

    return this.prisma.campaign.update({ where: { id }, data });
  }

  async close(id: string): Promise<Campaign> {
    const campaign = await this.findOne(id);
    this.assertModifiable(campaign);

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.CLOSED },
    });
  }

  async delete(id: string): Promise<Campaign> {
    await this.findOne(id);
    try {
      return await this.prisma.campaign.delete({ where: { id } });
    } catch (error) {
      // P2003: foreign key violation — the campaign has donations, which are
      // financial records and must be preserved.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          `Campaign ${id} has donations and cannot be deleted`,
        );
      }
      throw error;
    }
  }

  private assertModifiable(campaign: Campaign): void {
    if (campaign.status === CampaignStatus.COMPLETED) {
      throw new ConflictException(
        `Campaign ${campaign.id} is completed and cannot be modified`,
      );
    }
    if (campaign.status === CampaignStatus.CLOSED) {
      throw new ConflictException(
        `Campaign ${campaign.id} is closed and cannot be modified`,
      );
    }
  }

  private parseTargetAmount(value: string): Prisma.Decimal {
    let amount: Prisma.Decimal;
    try {
      amount = new Prisma.Decimal(value);
    } catch {
      throw new BadRequestException(
        'targetAmount must be a valid decimal number',
      );
    }
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException('targetAmount must be greater than zero');
    }
    return amount;
  }
}
