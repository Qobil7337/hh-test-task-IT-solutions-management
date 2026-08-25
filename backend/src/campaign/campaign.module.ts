import { Module } from '@nestjs/common';
import { CampaignResolver } from './campaign.resolver';
import { CampaignService } from './campaign.service';

@Module({
  providers: [CampaignService, CampaignResolver],
  exports: [CampaignService],
})
export class CampaignModule {}
