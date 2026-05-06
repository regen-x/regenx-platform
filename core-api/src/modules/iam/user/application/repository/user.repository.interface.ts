import { ICollection } from '../../../../../common/application/dto/collection.interface';
import {
  FilterOptions,
  IGetAllOptions,
} from '../../../../../common/application/interface/get-all-options.interface';
import { User } from '../../domain/user.domain';

export const USER_REPOSITORY_KEY = 'user_repository';

export interface IUserRepository {
  getAll(options: IGetAllOptions<User>): Promise<ICollection<User>>;
  getOneByFilter(filter: FilterOptions<User>): Promise<User>;
  getOneByEmailOrFail(email: string): Promise<User>;
  saveOne(user: User): Promise<User>;
  updateOneOrFail(
    id: number,
    updates: Partial<Omit<User, 'id'>>,
  ): Promise<User>;
}
