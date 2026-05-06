import { Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/transaction.domain';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { ProjectMapper } from '../../../project/application/mapper/project.mapper';
import { UserMapper } from '../../../iam/user/application/mapper/user.mapper';

@Injectable()
export class TransactionMapper {
  constructor(
    private readonly userMapper: UserMapper,
    private readonly projectMapper: ProjectMapper,
  ) {}

  fromTransactionToTransactionResponseDto(
    transaction: Transaction,
  ): TransactionResponseDto {
    return {
      uuid: transaction.uuid,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      amount: transaction.amount,
      currency: transaction.currency,
      tokenAmount: transaction.tokenAmount,
      type: transaction.type,
      status: transaction.status,
      reference: transaction.reference,
      description: transaction.description,
      settledAt: transaction.settledAt
        ? new Date(transaction.settledAt as any).toISOString()
        : undefined,
      userUuid: transaction.user?.uuid,
      projectUuid: transaction.project?.uuid,
      user: transaction.user
        ? this.userMapper.fromUserToUserResponseDto(transaction.user)
        : undefined,
      project: transaction.project
        ? this.projectMapper.fromProjectToProjectResponseDto(transaction.project)
        : undefined,
    };
  }
}
