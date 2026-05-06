import { Base } from '../../../common/domain/base.domain';
import { User } from '../../iam/user/domain/user.domain';
import { Project } from '../../project/domain/project.domain';

export class Offer extends Base {
  price: number;
  amount: number;
  user: User;
  project: Project;
  isActive: boolean;
  externalId: number;

  constructor(
    uuid?: string,
    id?: number,
    createdAt?: string,
    updatedAt?: string,
    deletedAt?: string,
    price?: number,
    amount?: number,
    user?: User,
    project?: Project,
    isActive?: boolean,
    externalId?: number,
  ) {
    super(id, uuid, createdAt, updatedAt, deletedAt);
    this.price = price;
    this.amount = amount;
    this.user = user;
    this.project = project;
    this.isActive = isActive;
    this.externalId = externalId;
  }
}
