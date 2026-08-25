import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
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

  @Mutation(() => Donation)
  createDonation(@Args('input') input: CreateDonationInput): Promise<Donation> {
    return this.donationService.create(input);
  }
}
