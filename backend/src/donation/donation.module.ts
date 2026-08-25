import { Module } from '@nestjs/common';
import { DonationResolver } from './donation.resolver';
import { DonationService } from './donation.service';

@Module({
  providers: [DonationService, DonationResolver],
  exports: [DonationService],
})
export class DonationModule {}
