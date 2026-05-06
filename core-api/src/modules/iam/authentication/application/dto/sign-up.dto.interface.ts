import { UserType } from '../../../user/domain/user-type.enum';

export interface ISignUpDto {
  email: string;
  password: string;
  fullname: string;
  phoneNumber: string;
  birthdate: string;
  type: UserType;
}
