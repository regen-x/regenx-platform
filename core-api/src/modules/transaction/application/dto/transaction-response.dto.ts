import { UserResponseDto } from '../../../iam/user/application/dto/user-response.dto';
import { ProjectResponseDto } from '../../../project/application/dto/project-response.dto';
import { TRANSACTION_TYPE } from '../../domain/transaction-type.enum';
import { TRANSACTION_STATUS } from '../../domain/transaction-status.enum';

export class TransactionResponseDto {
  uuid: string;
  userUuid?: string;
  projectUuid?: string;
  amount: number;
  currency: string;
  tokenAmount?: number;
  type: TRANSACTION_TYPE;
  status: TRANSACTION_STATUS;
  reference?: string;
  description?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: UserResponseDto;
  project?: ProjectResponseDto;
}
