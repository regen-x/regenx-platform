import { Base } from '../../../common/domain/base.domain';
import { User } from '../../iam/user/domain/user.domain';
import { Project } from '../../project/domain/project.domain';
import { TRANSACTION_TYPE } from './transaction-type.enum';
import { TRANSACTION_STATUS } from './transaction-status.enum';

export class Transaction extends Base {
  user?: User;
  project?: Project;
  amount: number;
  currency: string;
  tokenAmount?: number;
  status: TRANSACTION_STATUS;
  reference?: string;
  description?: string;
  settledAt?: string | Date;
  type: TRANSACTION_TYPE;

  constructor(
    uuid?: string,
    id?: number,
    createdAt?: string,
    updatedAt?: string,
    deletedAt?: string,
    user?: User,
    project?: Project,
    amount?: number,
    currency?: string,
    tokenAmount?: number,
    status?: TRANSACTION_STATUS,
    reference?: string,
    description?: string,
    settledAt?: string | Date,
    type?: TRANSACTION_TYPE,
  ) {
    super(id, uuid, createdAt, updatedAt, deletedAt);
    this.user = user;
    this.project = project;
    this.amount = amount;
    this.currency = currency;
    this.tokenAmount = tokenAmount;
    this.status = status;
    this.reference = reference;
    this.description = description;
    this.settledAt = settledAt;
    this.type = type;
  }
}
