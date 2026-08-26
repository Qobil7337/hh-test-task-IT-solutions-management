import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DonationResolver } from './donation.resolver';
import { DonationService } from './donation.service';

@Module({
  imports: [AuthModule],
  providers: [DonationService, DonationResolver],
  exports: [DonationService],
})
export class DonationModule {}
