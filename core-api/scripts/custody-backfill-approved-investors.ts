import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppModule } from '../src/modules/app/app.module';
import { InvestorVerificationEntity } from '../src/modules/investor-verification/entities/investor-verification.entity';
import { CustodyAccountService } from '../src/modules/custody/application/service/custody-account.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const verificationRepo = app.get<Repository<InvestorVerificationEntity>>(
    getRepositoryToken(InvestorVerificationEntity),
  );
  const custodyService = app.get(CustodyAccountService);

  const approved = await verificationRepo.find({
    where: { investorEligibilityStatus: 'approved' },
  });

  const summary = {
    approvedInvestorsScanned: approved.length,
    custodyAccountsCreated: 0,
    alreadyExisted: 0,
    failed: 0,
  };

  for (const row of approved) {
    try {
      const before = await custodyService.getInvestorCustodySummary(row.userId);
      const result = await custodyService.getOrCreateInvestorCustodyAccount({
        investorId: Number(row.userId),
        userId: Number(row.userId),
        metadata: {
          trigger: 'custody_backfill_approved_investors',
          verificationId: row.id,
        },
      });

      if (before.custodyAccountId) {
        summary.alreadyExisted += 1;
      } else if (result.custodyStatus === 'failed') {
        summary.failed += 1;
      } else {
        summary.custodyAccountsCreated += 1;
      }
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Backfill failed for investor userId=${row.userId}: ${message}`);
    }
  }

  console.log(JSON.stringify(summary, null, 2));
  await app.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
