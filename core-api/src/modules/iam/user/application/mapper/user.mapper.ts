import { Injectable } from '@nestjs/common';
import { User } from '../../domain/user.domain';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserMapper {
  fromUserToUserResponseDto(user: User): UserResponseDto {
    const userResponseDto = new UserResponseDto();
    userResponseDto.id = user.uuid;
    userResponseDto.email = user.email;
    userResponseDto.externalId = user.externalId;
    userResponseDto.role = user.role;
    userResponseDto.createdAt = user.createdAt;
    userResponseDto.updatedAt = user.updatedAt;
    userResponseDto.deletedAt = user.deletedAt;
    userResponseDto.fullName = user.fullname;
    userResponseDto.birthdate = user.birthdate;
    userResponseDto.phoneNumber = user.phoneNumber;
    userResponseDto.type = user.type;
    userResponseDto.walletAddress = user.walletAddress;
    userResponseDto.walletManager = user.walletManager?.uuid;
    return userResponseDto;
  }
}
