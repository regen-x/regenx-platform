import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  Repository,
} from 'typeorm';
import { IUserRepository } from '../../application/repository/user.repository.interface';
import { User } from '../../domain/user.domain';
import { UserNotFoundException } from './exception/user-not-found.exception';
import {
  FilterOptions,
  IGetAllOptions,
} from '../../../../../common/application/interface/get-all-options.interface';
import { ICollection } from '../../../../../common/application/dto/collection.interface';
import { UserEntity } from '../persistence/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { EmailNotFoundException } from './exception/email-not-found.exception';

@Injectable()
export class UserMysqlRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getAll(
    options: IGetAllOptions<User & { walletManagerUuid: string }>,
  ): Promise<ICollection<User>> {
    const {
      filter: { fullname, walletManagerUuid, ...filter },
      page,
      sort,
      fields,
    } = options || {};

    const whereOptions: FindOptionsWhere<UserEntity> = {
      ...filter,
    };

    if (fullname) {
      whereOptions.fullname = ILike(`%${fullname}%`);
    }

    if (walletManagerUuid) {
      whereOptions.walletManager = { uuid: walletManagerUuid };
    }

    let relations: FindOptionsRelations<UserEntity>;

    if (!Object.values(fields || {}).length) {
      relations = ['walletManager'] as FindOptionsRelations<UserEntity>;
    }

    const [items, itemCount] = await this.userRepository.findAndCount({
      where: whereOptions,
      order: sort,
      select: fields as FindOptionsSelect<UserEntity>,
      take: page.size,
      skip: page.offset,
      relations,
    });

    return {
      data: items,
      pageNumber: page.number,
      pageSize: page.size,
      pageCount: Math.ceil(itemCount / page.size),
      itemCount,
    };
  }

  async getOneByFilter(filter: FilterOptions<User>): Promise<User> {
    return this.userRepository.findOne({
      where: filter,
      relations: ['walletManager'],
    });
  }

  async getOneByEmailOrFail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new EmailNotFoundException({
        email,
      });
    }

    return user;
  }

  async saveOne(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async updateOneOrFail(
    id: number,
    updates: Partial<Omit<User, 'id'>>,
  ): Promise<User> {
    const userToUpdate = await this.userRepository.preload({
      id,
      ...updates,
    });

    if (!userToUpdate) {
      throw new UserNotFoundException({
        message: `User with ID ${id} not found`,
      });
    }

    return this.userRepository.save(userToUpdate);
  }
}
