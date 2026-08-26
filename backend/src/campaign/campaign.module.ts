import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampaignResolver } from './campaign.resolver';
import { CampaignService } from './campaign.service';

@Module({
  imports: [AuthModule],
  providers: [CampaignService, CampaignResolver],
  exports: [CampaignService],
})
export class CampaignModule {}
