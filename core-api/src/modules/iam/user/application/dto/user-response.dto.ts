import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppRole } from '../../../authorization/domain/app-role.enum';
import { UserType } from '../../domain/user-type.enum';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  externalId?: string;

  @ApiProperty()
  role: AppRole;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  deletedAt?: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  birthdate: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  type: UserType;

  @ApiProperty()
  walletAddress?: string;

  @ApiProperty()
  walletManager?: string;
}
