import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CampaignService } from './campaign.service';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { UpdateCampaignInput } from './dto/update-campaign.input';
import { Campaign } from './models/campaign.model';

@Resolver(() => Campaign)
export class CampaignResolver {
  constructor(private readonly campaignService: CampaignService) {}

  @Query(() => [Campaign], { description: 'List all campaigns, newest first' })
  campaigns(): Promise<Campaign[]> {
    return this.campaignService.findAll();
  }

  @Query(() => Campaign, { description: 'Get a single campaign by id' })
  campaign(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Campaign> {
    return this.campaignService.findOne(id);
  }

  @Mutation(() => Campaign)
  createCampaign(@Args('input') input: CreateCampaignInput): Promise<Campaign> {
    return this.campaignService.create(input);
  }

  @Mutation(() => Campaign)
  updateCampaign(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @Args('input') input: UpdateCampaignInput,
  ): Promise<Campaign> {
    return this.campaignService.update(id, input);
  }

  @Mutation(() => Campaign)
  closeCampaign(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Campaign> {
    return this.campaignService.close(id);
  }

  @Mutation(() => Campaign, {
    description: 'Delete a campaign (only possible while it has no donations)',
  })
  deleteCampaign(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Campaign> {
    return this.campaignService.delete(id);
  }
}
