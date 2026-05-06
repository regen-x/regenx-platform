import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ITransactionRepository } from '../../application/repository/transaction.repository.interface';
import { Transaction } from '../../domain/transaction.domain';
import { TransactionEntity } from '../persistence/entities/transaction.entity';
import { ICollection } from '../../../../common/application/dto/collection.interface';
import { IGetAllOptions } from '../../../../common/application/interface/get-all-options.interface';
import { Project } from '../../../project/domain/project.domain';
import { TRANSACTION_TYPE } from '../../domain/transaction-type.enum';
import { TRANSACTION_STATUS } from '../../domain/transaction-status.enum';

@Injectable()
export class TransactionPostgresqlRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async saveOne(transaction: Transaction): Promise<Transaction> {
    return this.transactionRepository.save(transaction);
  }

  private baseQuery(): SelectQueryBuilder<TransactionEntity> {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.user', 'user')
      .leftJoin('transaction.project', 'project')
      .select([
        'transaction',
        'user.id',
        'user.uuid',
        'user.fullname',
        'user.walletAddress',
        'project.id',
        'project.uuid',
        'project.name',
      ])
      .andWhere('transaction.deleted_at IS NULL');
  }

  private applyFilters(
    qb: SelectQueryBuilder<TransactionEntity>,
    filter?: any,
  ) {
    if (!filter) return qb;

    if (filter.projectUuid) {
      qb.andWhere('project.uuid = :projectUuid', {
        projectUuid: filter.projectUuid,
      });
    }

    if (filter.currency) {
      qb.andWhere('transaction.currency = :currency', {
        currency: filter.currency,
      });
    }

    if (filter.type) {
      qb.andWhere('transaction.type = :type', { type: filter.type });
    }

    if (filter.status) {
      qb.andWhere('transaction.status = :status', { status: filter.status });
    }

    if (filter.dateFrom) {
      qb.andWhere('transaction.created_at >= :dateFrom', {
        dateFrom: filter.dateFrom,
      });
    }

    if (filter.dateTo) {
      qb.andWhere('transaction.created_at <= :dateTo', {
        dateTo: filter.dateTo,
      });
    }

    return qb;
  }

  private applySortAndPage(
    qb: SelectQueryBuilder<TransactionEntity>,
    options: IGetAllOptions<Transaction>,
  ) {
    const { sort, page } = options;

    if (sort && Object.keys(sort).length > 0) {
      let hasValidSort = false;

      Object.entries(sort).forEach(([key, direction]) => {
        const sortFieldMap: Record<string, string> = {
          createdAt: 'transaction.createdAt',
          updatedAt: 'transaction.updatedAt',
          settledAt: 'transaction.settledAt',
          amount: 'transaction.amount',
          type: 'transaction.type',
          status: 'transaction.status',
        };

        const sortField = sortFieldMap[key];
        if (sortField) {
          hasValidSort = true;
          qb.addOrderBy(sortField, direction as 'ASC' | 'DESC');
        }
      });

      if (!hasValidSort) {
        qb.orderBy('transaction.createdAt', 'DESC');
      }
    } else {
      qb.orderBy('transaction.createdAt', 'DESC');
    }

    if (page?.size) {
      qb.take(page.size);
      qb.skip(page?.offset || 0);
    }

    return qb;
  }

  private async getCollection(
    qb: SelectQueryBuilder<TransactionEntity>,
    page?: IGetAllOptions<Transaction>['page'],
  ): Promise<ICollection<Transaction>> {
    const items = await qb.getMany();
    const itemCount = await qb
      .clone()
      .skip(undefined)
      .take(undefined)
      .offset(undefined)
      .limit(undefined)
      .orderBy()
      .getCount();

    return {
      data: items,
      pageNumber: page?.number || 1,
      pageSize: page?.size || items.length,
      pageCount: page?.size ? Math.ceil(itemCount / page.size) : 1,
      itemCount,
    };
  }

  async getAll(
    options: IGetAllOptions<Transaction>,
  ): Promise<ICollection<Transaction>> {
    const qb = this.applySortAndPage(
      this.applyFilters(this.baseQuery(), options.filter),
      options,
    );

    return this.getCollection(qb, options.page);
  }

  async getUserTransactions(
    userId: number,
    options: IGetAllOptions<Transaction>,
  ): Promise<ICollection<Transaction>> {
    const qb = this.baseQuery().andWhere('transaction.user_id = :userId', {
      userId,
    });

    this.applyFilters(qb, options.filter);
    this.applySortAndPage(qb, options);

    return this.getCollection(qb, options.page);
  }

  async getProjectTransactions(
    projectId: number,
    options: IGetAllOptions<Transaction>,
  ): Promise<ICollection<Transaction>> {
    const qb = this.baseQuery().andWhere('transaction.project_id = :projectId', {
      projectId,
    });

    this.applyFilters(qb, options.filter);
    this.applySortAndPage(qb, options);

    return this.getCollection(qb, options.page);
  }

  async getDeveloperTransactions(
    developerUserId: number,
    options: IGetAllOptions<Transaction>,
  ): Promise<ICollection<Transaction>> {
    const qb = this.baseQuery().andWhere('project.user_id = :developerUserId', {
      developerUserId,
    });

    this.applyFilters(qb, options.filter);
    this.applySortAndPage(qb, options);

    return this.getCollection(qb, options.page);
  }

  async getRaisedAmountByProjectId(projectId: number): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'raisedAmount')
      .where('transaction.project_id = :projectId', { projectId })
      .andWhere('transaction.deleted_at IS NULL')
      .andWhere('transaction.type = :type', { type: TRANSACTION_TYPE.BUY })
      .andWhere('transaction.status = :status', {
        status: TRANSACTION_STATUS.COMPLETED,
      })
      .getRawOne();

    return Number(result?.raisedAmount || 0);
  }


    async getUniqueProjectsByBuyerAddress(
    buyerAddress: string,
  ): Promise<(Project & { purchasedAmount?: number })[]> {
    const projects = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.project', 'project')
      .innerJoin('transaction.user', 'buyer')
      .where('buyer.walletAddress = :buyerAddress', { buyerAddress })
      .andWhere('transaction.type = :type', { type: TRANSACTION_TYPE.BUY })
      .andWhere('transaction.status = :status', {
        status: TRANSACTION_STATUS.COMPLETED,
      })
      .select([
        'project.id as id',
        'project.uuid as uuid',
        'project.created_at as created_at',
        'project.updated_at as updated_at',
        'project.deleted_at as deleted_at',
        'project.name as name',
        'project.description as description',
        'project.location as location',
        'project.funding_goal as funding_goal',
        'project.start_date as start_date',
        'project.end_date as end_date',
        'project.climate_impact as climate_impact',
        'project.token_supply as token_supply',
        'project.token_price as token_price',
        'project.token_symbol as token_symbol',
        'project.token_address as token_address',
        'project.owner_address as owner_address',
        'project.generates_carbon_credits as generates_carbon_credits',
        'SUM(transaction.token_amount) as purchased_amount',
      ])
      .groupBy('project.id')
      .addGroupBy('project.uuid')
      .addGroupBy('project.created_at')
      .addGroupBy('project.updated_at')
      .addGroupBy('project.deleted_at')
      .addGroupBy('project.name')
      .addGroupBy('project.description')
      .addGroupBy('project.location')
      .addGroupBy('project.funding_goal')
      .addGroupBy('project.start_date')
      .addGroupBy('project.end_date')
      .addGroupBy('project.climate_impact')
      .addGroupBy('project.token_supply')
      .addGroupBy('project.token_price')
      .addGroupBy('project.token_symbol')
      .addGroupBy('project.token_address')
      .addGroupBy('project.owner_address')
      .addGroupBy('project.generates_carbon_credits')
      .getRawMany();

    return projects.map((rawProject) => ({
      ...rawProject,
      uuid: rawProject.uuid,
      id: rawProject.id,
      createdAt: rawProject.created_at,
      updatedAt: rawProject.updated_at,
      deletedAt: rawProject.deleted_at,
      name: rawProject.name,
      description: rawProject.description,
      location: rawProject.location,
      fundingGoal: Number(rawProject.funding_goal),
      startDate: rawProject.start_date,
      endDate: rawProject.end_date,
      climateImpact: rawProject.climate_impact,
      generatesCarbonCredits: rawProject.generates_carbon_credits,
      tokenAddress: rawProject.token_address,
      ownerAddress: rawProject.owner_address,
      tokenSupply: Number(rawProject.token_supply),
      tokenPrice: Number(rawProject.token_price),
      tokenSymbol: rawProject.token_symbol,
      purchasedAmount: Number(rawProject.purchased_amount || 0),
    }));
  }
}
