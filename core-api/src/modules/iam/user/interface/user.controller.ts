import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { USER_ENTITY_NAME } from '../domain/user.name';
import { ControllerEntity } from '../../../../common/application/interface/decorators/endpoint-entity.decorator';
import { UserService } from '../application/service/user.service';
import { UserMapper } from '../application/mapper/user.mapper';
import { UserResponseAdapter } from '../application/adapter/user-responser.adapter';
import { Policies } from '../../authorization/infrastructure/policy/decorator/policy.decorator';
import { ReadUserPolicyHandler } from '../../authentication/application/policy/read-user-policy.handler';
import { PageQueryParamsDto } from '../../../../common/application/dto/page-query-params.dto';
import { UserFilterQueryParamsDto } from '../application/dto/user-filter-query-params.dto';
import { UserSortQueryParamsDto } from '../application/dto/user-sort-query-params.dto';
import { UserFieldsQueryParamsDto } from '../application/dto/user-fields-query-params.dto';
import { UserResponseDto } from '../application/dto/user-response.dto';
import { ManySerializedResponseDto } from '../../../../common/application/dto/many-serialized-response.dto';
import { User } from '../domain/user.domain';
import { CurrentUser } from '../../authentication/infrastructure/decorator/current-user.decorator';
import { OneSerializedResponseDto } from '../../../../common/application/dto/one-serialized-response.dto';
import { UpdateSelfDto } from '../application/dto/update-self.dto';
import { CreateAddManagerTransactionDto } from '../application/dto/create-add-manager-transaction.dto';
import { SubmitAddManagerTransactionDto } from '../application/dto/submit-add-manager-transaction.dto';
import { BuildTransactionResponseDto } from '../../../../common/infrastructure/stellar/dto/build-transaction-response.dto';
import { ProjectResponseDto } from '../../../project/application/dto/project-response.dto';
import { GetUserPortfolioParamsDto } from '../application/dto/get-user-portfolio-params.dto';

@Controller('user')
@ControllerEntity(USER_ENTITY_NAME)
@ApiTags('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
    private readonly userResponseAdapter: UserResponseAdapter,
  ) {}

  @Get()
  @Policies(ReadUserPolicyHandler)
  async getAll(
    @Query('page') page: PageQueryParamsDto,
    @Query('filter') filter: UserFilterQueryParamsDto,
    @Query('sort') sort: UserSortQueryParamsDto,
    @Query('fields') fields: UserFieldsQueryParamsDto,
  ): Promise<ManySerializedResponseDto<UserResponseDto>> {
    return this.userService.getAll({
      page,
      filter,
      sort,
      fields: fields.target,
    });
  }

  @Get('me')
  @Policies(ReadUserPolicyHandler)
  async getMe(
    @CurrentUser() user: User,
  ): Promise<OneSerializedResponseDto<UserResponseDto>> {
    return this.userResponseAdapter.oneEntityResponse(
      USER_ENTITY_NAME,
      this.userMapper.fromUserToUserResponseDto(user),
    );
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: User,
    @Body() userUpdates: UpdateSelfDto,
  ): Promise<OneSerializedResponseDto<UserResponseDto>> {
    return await this.userService.updateSelf(user, userUpdates);
  }

  @Post('/me/wallet-manager/transaction')
  async createAddManagerTransaction(
    @CurrentUser() user: User,
    @Body() { managerUuid }: CreateAddManagerTransactionDto,
  ): Promise<OneSerializedResponseDto<BuildTransactionResponseDto>> {
    return await this.userService.createAddManagerTransaction(
      user.walletAddress,
      managerUuid,
    );
  }

  @Post('/me/wallet-manager')
  async addManager(
    @CurrentUser() user: User,
    @Body() { managerUuid, transactionXdr }: SubmitAddManagerTransactionDto,
  ): Promise<OneSerializedResponseDto<UserResponseDto>> {
    return await this.userService.submitAddManagerTransaction(
      user,
      managerUuid,
      transactionXdr,
    );
  }

  @Get(':userAddress/portfolio')
  async getUserPortfolio(
    @Param(ValidationPipe) { userAddress }: GetUserPortfolioParamsDto,
  ): Promise<ManySerializedResponseDto<ProjectResponseDto>> {
    return this.userService.getUserPortfolio({ userAddress });
  }
}
