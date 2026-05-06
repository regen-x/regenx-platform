import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY_KEY,
} from '../repository/transaction.repository.interface';
import { TransactionMapper } from '../mapper/transaction.mapper';
import { TransactionResponseAdapter } from '../adapter/transaction-response.adapter';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Transaction } from '../../domain/transaction.domain';
import { OneSerializedResponseDto } from '../../../../common/application/dto/one-serialized-response.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { TRANSACTION_ENTITY_NAME } from '../../domain/transaction.name';
import { MapperService } from '../../../../common/application/mapper/mapper.service';
import { IGetAllOptions } from '../../../../common/application/interface/get-all-options.interface';
import { ManySerializedResponseDto } from '../../../../common/application/dto/many-serialized-response.dto';
import { TRANSACTION_STATUS } from '../../domain/transaction-status.enum';
import { TRANSACTION_TYPE } from '../../domain/transaction-type.enum';
import {
  IProjectRepository,
  PROJECT_REPOSITORY_KEY,
} from '../../../project/application/repository/project.repository.interface';
import { TransactionEntity } from '../../infrastructure/persistence/entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_KEY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly transactionMapper: TransactionMapper,
    private readonly transactionResponseAdapter: TransactionResponseAdapter,
    private readonly genericMapperService: MapperService,
    @Inject(PROJECT_REPOSITORY_KEY)
    private readonly projectRepository: IProjectRepository,

    @InjectRepository(TransactionEntity)
    private readonly transactionEntityRepo: Repository<TransactionEntity>,
  ) {}

  private toNumber(value: unknown) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private isFinalizedStatus(status?: TRANSACTION_STATUS) {
    return status === TRANSACTION_STATUS.COMPLETED;
  }

  private async findDuplicateFinalizedTransaction(input: {
    userId?: number | null;
    projectId?: number | null;
    type: TRANSACTION_TYPE;
    status: TRANSACTION_STATUS;
    reference?: string | null;
  }) {
    if (!input.reference || !this.isFinalizedStatus(input.status)) {
      return null;
    }

    const qb = this.transactionEntityRepo
      .createQueryBuilder('transaction')
      .where('transaction.reference = :reference', {
        reference: input.reference,
      })
      .andWhere('transaction.type = :type', { type: input.type })
      .andWhere('transaction.status = :status', { status: input.status })
      .andWhere('transaction.deleted_at IS NULL');

    if (input.userId == null) {
      qb.andWhere('transaction.user_id IS NULL');
    } else {
      qb.andWhere('transaction.user_id = :userId', {
        userId: Number(input.userId),
      });
    }

    if (input.projectId == null) {
      qb.andWhere('transaction.project_id IS NULL');
    } else {
      qb.andWhere('transaction.project_id = :projectId', {
        projectId: Number(input.projectId),
      });
    }

    return qb.getOne();
  }

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<OneSerializedResponseDto<TransactionResponseDto>> {
    const amount = this.toNumber(createTransactionDto.amount);
    const tokenAmount =
      createTransactionDto.tokenAmount == null
        ? null
        : this.toNumber(createTransactionDto.tokenAmount);
    const status =
      createTransactionDto.status || TRANSACTION_STATUS.PENDING;
    const settledAt = createTransactionDto.settledAt
      ? new Date(createTransactionDto.settledAt)
      : undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Transaction amount must be greater than zero');
    }

    if (tokenAmount != null && tokenAmount < 0) {
      throw new BadRequestException('Token amount cannot be negative');
    }

    if (status === TRANSACTION_STATUS.COMPLETED && !settledAt) {
      throw new BadRequestException(
        'Completed transactions must include a settled timestamp',
      );
    }

    const duplicateFinalizedTransaction =
      await this.findDuplicateFinalizedTransaction({
        userId: createTransactionDto.userId,
        projectId: createTransactionDto.projectId,
        type: createTransactionDto.type,
        status,
        reference: createTransactionDto.reference,
      });

    if (duplicateFinalizedTransaction) {
      const matchesExistingRecord =
        this.toNumber(duplicateFinalizedTransaction.amount) === amount &&
        this.toNumber(duplicateFinalizedTransaction.tokenAmount) ===
          this.toNumber(tokenAmount);

      if (!matchesExistingRecord) {
        throw new BadRequestException(
          'A finalized transaction with this reference already exists and does not match the incoming ledger event',
        );
      }

      return this.transactionResponseAdapter.oneEntityResponse(
        TRANSACTION_ENTITY_NAME,
        this.transactionMapper.fromTransactionToTransactionResponseDto(
          duplicateFinalizedTransaction,
        ),
      );
    }

    const transaction = this.genericMapperService.dtoToClass(
      {
        ...createTransactionDto,
        amount,
        tokenAmount,
        user: createTransactionDto.userId
          ? { id: createTransactionDto.userId }
          : undefined,
        project: createTransactionDto.projectId
          ? { id: createTransactionDto.projectId }
          : undefined,
        currency: createTransactionDto.currency || 'AUD',
        status,
        settledAt,
      },
      new Transaction(),
    );

    const createdTransaction =
      await this.transactionRepository.saveOne(transaction);

    return this.transactionResponseAdapter.oneEntityResponse(
      TRANSACTION_ENTITY_NAME,
      this.transactionMapper.fromTransactionToTransactionResponseDto(
        createdTransaction,
      ),
    );
  }

  async getAllTransactions(
    options: IGetAllOptions<
      Transaction & {
        projectUuid?: string;
        currency?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >,
  ): Promise<ManySerializedResponseDto<TransactionResponseDto>> {
    const collection = await this.transactionRepository.getAll(options);

    return this.transactionResponseAdapter.manyEntitiesResponse(
      TRANSACTION_ENTITY_NAME,
      {
        ...collection,
        data: collection.data.map((transaction) =>
          this.transactionMapper.fromTransactionToTransactionResponseDto(
            transaction,
          ),
        ),
      },
    );
  }

  async getUserTransactions(
    userId: number,
    options: IGetAllOptions<
      Transaction & {
        projectUuid?: string;
        currency?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >,
  ) {
    const collection = await this.transactionRepository.getUserTransactions(
      userId,
      options,
    );

    return this.transactionResponseAdapter.manyEntitiesResponse(
      TRANSACTION_ENTITY_NAME,
      {
        ...collection,
        data: collection.data.map((transaction) =>
          this.transactionMapper.fromTransactionToTransactionResponseDto(
            transaction,
          ),
        ),
      },
    );
  }

  async getProjectTransactions(
    projectId: number,
    actorUserId: number,
    isAdmin: boolean,
    options: IGetAllOptions<
      Transaction & {
        currency?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >,
  ) {
    const project = await this.projectRepository.getOneByFilter({ id: projectId });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const projectOwnerId = Number((project as any)?.user?.id ?? (project as any)?.userId ?? 0);

    if (!isAdmin && projectOwnerId !== actorUserId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const collection = await this.transactionRepository.getProjectTransactions(
      projectId,
      options,
    );

    return this.transactionResponseAdapter.manyEntitiesResponse(
      TRANSACTION_ENTITY_NAME,
      {
        ...collection,
        data: collection.data.map((transaction) =>
          this.transactionMapper.fromTransactionToTransactionResponseDto(
            transaction,
          ),
        ),
      },
    );
  }

  async getDeveloperTransactions(
    developerUserId: number,
    options: IGetAllOptions<
      Transaction & {
        projectUuid?: string;
        currency?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >,
  ) {
    const collection = await this.transactionRepository.getDeveloperTransactions(
      developerUserId,
      options,
    );

    return this.transactionResponseAdapter.manyEntitiesResponse(
      TRANSACTION_ENTITY_NAME,
      {
        ...collection,
        data: collection.data.map((transaction) =>
          this.transactionMapper.fromTransactionToTransactionResponseDto(
            transaction,
          ),
        ),
      },
    );
  }

  async createCashRequest(input: {
    userId: number;
    type: 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    currency?: string;
    description?: string;
  }) {
    if (!Number.isFinite(Number(input.amount)) || Number(input.amount) <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    return this.createTransaction({
      userId: input.userId,
      amount: Number(input.amount),
      currency: input.currency || 'AUD',
      type: input.type as any,
      status: TRANSACTION_STATUS.PENDING,
      description:
        input.description ||
        (input.type === 'DEPOSIT'
          ? 'Cash account deposit request'
          : 'Cash account withdrawal request'),
    });
  }

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<OneSerializedResponseDto<TransactionResponseDto>> {
    return this.createTransaction(createTransactionDto);
  }

  async getAll(
    options: IGetAllOptions<Transaction & Record<string, any>>,
  ): Promise<ManySerializedResponseDto<TransactionResponseDto>> {
    return this.getAllTransactions(options);
  }
}
