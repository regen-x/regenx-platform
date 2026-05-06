import { UserType } from '../../../user/domain/user-type.enum';
import { ISignInDto } from '../../application/dto/sign-in.dto.interface';
import { ISignUpDto } from '../../application/dto/sign-up.dto.interface';

export const mockValidSignInDto: ISignInDto = {
  email: 'admin@test.com',
  password: 'Password1!',
};

export const mockInexistentSignInDto: ISignInDto = {
  email: 'unregistered@test.com',
  password: 'Password1!',
};

export const mockInvalidSignInDto: ISignInDto = {
  email: 'test',
  password: 'Password1!',
};

export const mockValidSignUpDto: ISignUpDto = {
  email: 'john.doe@test.com',
  password: '$Test123',
  birthdate: '1999-01-01',
  fullname: 'John Doe',
  phoneNumber: '+541123456789',
  type: UserType.CLIMATE_DEVELOPER,
};

export const mockUnconfirmedEmail = 'admin@test.com';
export const mockConfirmedEmail = 'confirm@test.com';
export const mockUnregisteredEmail = 'unregistered@test.com';
export const mockErrorEmail = 'error@test.com';
export const mockValidConfirmationCode = '123456';
export const mockInvalidConfirmationCode = 'fake';
