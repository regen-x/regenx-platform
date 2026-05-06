import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionService } from '../application/service/transaction.service';
import { TRANSACTION_ENTITY_NAME } from '../domain/transaction.name';
import { ControllerEntity } from '../../../common/application/interface/decorators/endpoint-entity.decorator';
import { PageQueryParamsDto } from '../../../common/application/dto/page-query-params.dto';
import { ManySerializedResponseDto } from '../../../common/application/dto/many-serialized-response.dto';
import { TransactionResponseDto } from '../application/dto/transaction-response.dto';
import { TransactionFieldsQueryParamsDto } from '../application/dto/transaction-fields-query-params.dto';
import { TransactionFilterQueryParamsDto } from '../application/dto/transaction-filter-query-params.dto';
import { TransactionSortQueryParamsDto } from '../application/dto/transaction-sort-query-params.dto';
import { AppRole } from '../../iam/authorization/domain/app-role.enum';

@Controller(['transaction', 'transactions'])
@ControllerEntity(TRANSACTION_ENTITY_NAME)
@ApiTags('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  private assertAuthenticated(req: any) {
    if (!req?.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
  }

  private assertAdmin(req: any) {
    this.assertAuthenticated(req);
    if (String(req?.user?.role ?? '') !== AppRole.Admin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  private isAdmin(req: any) {
    return String(req?.user?.role ?? '') === AppRole.Admin;
  }

  @Get('me')
  async getMine(
    @Req() req: any,
    @Query('page') page: PageQueryParamsDto,
    @Query('filter') filter: TransactionFilterQueryParamsDto,
    @Query('sort') sort: TransactionSortQueryParamsDto,
    @Query('fields') fields: TransactionFieldsQueryParamsDto,
  ): Promise<ManySerializedResponseDto<TransactionResponseDto>> {
    this.assertAuthenticated(req);

    return this.transactionService.getUserTransactions(Number(req.user.id), {
      page,
      filter,
      sort,
      fields: fields?.target,
    });
  }

  @Get('developer/me')
  async getDeveloperTransactions(
    @Req() req: any,
    @Query('page') page: PageQueryParamsDto,
    @Query('filter') filter: TransactionFilterQueryParamsDto,
    @Query('sort') sort: TransactionSortQueryParamsDto,
    @Query('fields') fields: TransactionFieldsQueryParamsDto,
  ): Promise<ManySerializedResponseDto<TransactionResponseDto>> {
    this.assertAuthenticated(req);

    return this.transactionService.getDeveloperTransactions(Number(req.user.id), {
      page,
      filter,
      sort,
      fields: fields?.target,
    });
  }

  @Get('project/:projectId')
  async getProjectTransactions(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: any,
    @Query('page') page: PageQueryParamsDto,
    @Query('filter') filter: TransactionFilterQueryParamsDto,
    @Query('sort') sort: TransactionSortQueryParamsDto,
    @Query('fields') fields: TransactionFieldsQueryParamsDto,
  ): Promise<ManySerializedResponseDto<TransactionResponseDto>> {
    this.assertAuthenticated(req);

    return this.transactionService.getProjectTransactions(
      projectId,
      Number(req.user.id),
      this.isAdmin(req),
      {
        page,
        filter,
        sort,
        fields: fields?.target,
      },
    );
  }

  @Get()
  async getAllTransactions(
    @Req() req: any,
    @Query('page') page: PageQueryParamsDto,
    @Query('filter') filter: TransactionFilterQueryParamsDto,
    @Query('sort') sort: TransactionSortQueryParamsDto,
    @Query('fields') fields: TransactionFieldsQueryParamsDto,
  ): Promise<ManySerializedResponseDto<TransactionResponseDto>> {
    this.assertAdmin(req);

    return this.transactionService.getAllTransactions({
      page,
      filter,
      sort,
      fields: fields?.target,
    });
  }

  @Post('cash-request')
  async createCashRequest(
    @Req() req: any,
    @Body()
    body: {
      type: 'DEPOSIT' | 'WITHDRAWAL';
      amount: number;
      currency?: string;
      description?: string;
    },
  ) {
    this.assertAuthenticated(req);

    return this.transactionService.createCashRequest({
      userId: Number(req.user.id),
      type: body.type,
      amount: Number(body.amount),
      currency: body.currency,
      description: body.description,
    });
  }
}
