import { ICollection } from '../../../../common/application/dto/collection.interface';
import { Transaction } from '../../domain/transaction.domain';
import { IGetAllOptions } from '../../../../common/application/interface/get-all-options.interface';
import { Project } from '../../../project/domain/project.domain';

export const TRANSACTION_REPOSITORY_KEY = 'TRANSACTION_REPOSITORY_KEY';

export interface ITransactionRepository {
  saveOne(transaction: Transaction): Promise<Transaction>;

  getAll(
    options: IGetAllOptions<
      Transaction & {
        projectUuid?: string;
        currency?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >,
  ): Promise<ICollection<Transaction>>;

  getUserTransactions(
    userId: number,
    options: IGetAllOptions<
      Transaction & {
        projectUuid?: string;
        currency?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >,
  ): Promise<ICollection<Transaction>>;

  getProjectTransactions(
    projectId: number,
    options: IGetAllOptions<
      Transaction & {
        currency?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >,
  ): Promise<ICollection<Transaction>>;

  getDeveloperTransactions(
    developerUserId: number,
    options: IGetAllOptions<
      Transaction & {
        projectUuid?: string;
        currency?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >,
  ): Promise<ICollection<Transaction>>;

  getUniqueProjectsByBuyerAddress(
    buyerAddress: string,
  ): Promise<(Project & { purchasedAmount?: number })[]>;

  getRaisedAmountByProjectId(projectId: number): Promise<number>;
}
