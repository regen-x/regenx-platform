import { UserResponseDto } from '../../application/dto/user-response.dto';

export const genericUserResponseDto: UserResponseDto = {
  id: expect.any(String),
  email: expect.any(String),
  externalId: expect.any(String),
  role: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  deletedAt: null,
  fullName: expect.any(String),
  birthdate: expect.any(String),
  phoneNumber: expect.any(String),
  type: expect.any(String),
  walletAddress: null,
};

export const validWalletAddress =
  'GAUPJCQQ7MKPZ375F7P5O2A5LXBBCQULAIIXA274LNZLTBXWVGZGEJFG';

export const wealthManagerUuid = '00000000-0000-0000-0000-00000000000Z';

export const transactionXdr =
  '0000000000000000000000000000000000000000000000000000000000000000';
