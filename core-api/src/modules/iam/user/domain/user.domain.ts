import { Base } from '../../../../common/domain/base.domain';

import { AppRole } from '../../authorization/domain/app-role.enum';
import { UserType } from './user-type.enum';

export class User extends Base {
  email: string;
  externalId?: string;
  role: AppRole;
  isVerified: boolean;
  fullname: string;
  birthdate: string;
  phoneNumber: string;
  type: UserType;
  walletAddress?: string;
  walletManager?: User;

  constructor(
    email: string,
    role: AppRole,
    externalId?: string,
    uuid?: string,
    id?: number,
    createdAt?: string,
    updatedAt?: string,
    deletedAt?: string,
    isVerified?: boolean,
    fullname?: string,
    birthdate?: string,
    phoneNumber?: string,
    type?: UserType,
    walletAddress?: string,
    walletManager?: User,
  ) {
    super(id, uuid, createdAt, updatedAt, deletedAt);
    this.email = email;
    this.externalId = externalId;
    this.role = role;
    this.isVerified = isVerified;
    this.fullname = fullname;
    this.birthdate = birthdate;
    this.phoneNumber = phoneNumber;
    this.type = type;
    this.walletAddress = walletAddress;
    this.walletManager = walletManager;
  }
}
