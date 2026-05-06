
import { BuildXlmPaymentTransactionDto } from '../application/dto/build-xlm-payment-transaction.dto';
import { SubmitXlmPaymentTransactionDto } from '../application/dto/submit-xlm-payment-transaction.dto';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PoliciesGuard } from '../../iam/authorization/infrastructure/policy/guard/policy.guard';
import { ContractService } from '../application/service/contract.service';
import { TransferTokenDto } from '../application/dto/transfer-token-params.dto';
import { SubmitTransferTransactionDto } from '../application/dto/submit-transfer-transaction.dto';
import { BuildTransactionResponseDto } from '../../../common/infrastructure/stellar/dto/build-transaction-response.dto';
import { OneSerializedResponseDto } from '../../../common/application/dto/one-serialized-response.dto';
import { TransactionResponseDto } from '../../transaction/application/dto/transaction-response.dto';

@Controller('contract')
@UseGuards(PoliciesGuard)
@ApiTags('contract')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post('transfer/transaction')
  buildTransferTransaction(
    @Body() { tokenAddress, investorAddress, amount }: TransferTokenDto,
  ): Promise<OneSerializedResponseDto<BuildTransactionResponseDto>> {
    return this.contractService.buildTransferTransaction(
      tokenAddress,
      investorAddress,
      amount,
    );
  }

  @Post('transfer')
  submitTransferTransaction(
    @Body() submitTransferTransactionDto: SubmitTransferTransactionDto,
  ): Promise<OneSerializedResponseDto<TransactionResponseDto>> {
    return this.contractService.submitTransferTransaction(
      submitTransferTransactionDto,
    );
  }

  @Post('xlm-payment/transaction')
  buildXlmPaymentTransaction(
    @Body() { investorAddress, amount }: BuildXlmPaymentTransactionDto,
  ): Promise<OneSerializedResponseDto<BuildTransactionResponseDto>> {
    return this.contractService.buildXlmPaymentTransaction(
      investorAddress,
      amount,
    );
  }

  @Post('xlm-payment')
  submitXlmPaymentTransaction(
    @Body() submitXlmPaymentTransactionDto: SubmitXlmPaymentTransactionDto,
  ): Promise<OneSerializedResponseDto<TransactionResponseDto>> {
    return this.contractService.submitXlmPaymentTransaction(
      submitXlmPaymentTransactionDto,
    );
  }



}
