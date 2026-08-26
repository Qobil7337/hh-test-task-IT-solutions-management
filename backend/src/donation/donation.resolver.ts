import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User as UserEntity } from '../generated/prisma/client';
import { DonationService } from './donation.service';
import { CreateDonationInput } from './dto/create-donation.input';
import { Donation } from './models/donation.model';

@Resolver(() => Donation)
export class DonationResolver {
  constructor(private readonly donationService: DonationService) {}

  @Query(() => [Donation], {
    description: 'Donations of a campaign, newest first',
  })
  donations(
    @Args('campaignId', { type: () => ID }, ParseUUIDPipe) campaignId: string,
  ): Promise<Donation[]> {
    return this.donationService.findByCampaign(campaignId);
  }

  @Query(() => [Donation], {
    description: "The current user's donation history, newest first",
  })
  @Auth()
  myDonations(@CurrentUser() user: UserEntity): Promise<Donation[]> {
    return this.donationService.findByUser(user.id);
  }

  @Mutation(() => Donation)
  @Auth()
  createDonation(
    @Args('input') input: CreateDonationInput,
    @CurrentUser() user: UserEntity,
  ): Promise<Donation> {
    return this.donationService.create(input, user.id);
  }
}
