import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InvestorCertificateService } from './application/service/investor-certificate.service';
import { InvestorCertificateController } from './interface/investor-certificate.controller';

@Module({
  imports: [ConfigModule],
  controllers: [InvestorCertificateController],
  providers: [InvestorCertificateService],
  exports: [InvestorCertificateService],
})
export class InvestorCertificateModule {}
