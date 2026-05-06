import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import {
  FilterOptions,
  IGetAllOptions,
} from '../../../../common/application/interface/get-all-options.interface';
import { ICollection } from '../../../../common/application/dto/collection.interface';
import { Offer } from '../../domain/offer.domain';
import { OfferEntity } from '../persistence/entities/offer.entity';
import { OfferNotFoundException } from './exception/offer-not-found.exception';
import { IOfferRepository } from '../../application/repository/offer.repository.interface';

@Injectable()
export class OfferPostgresqlRepository implements IOfferRepository {
  constructor(
    @InjectRepository(OfferEntity)
    private readonly offerRepository: Repository<OfferEntity>,
  ) {}

  async getAll(
    options: IGetAllOptions<
      Offer & {
        tokenSymbol?: string;
        userAddress?: string;
        excludeAddress?: string;
      }
    >,
  ): Promise<ICollection<Offer>> {
    const {
      filter: { tokenSymbol, userAddress, excludeAddress, ...filter },
      page,
    } = options || {};

    const whereOptions: FindOptionsWhere<OfferEntity> = {
      ...filter,
    };

    if (tokenSymbol) {
      whereOptions.project = { tokenSymbol: ILike(`%${tokenSymbol}%`) };
    }

    if (userAddress) {
      whereOptions.user = { walletAddress: userAddress };
    }

    if (excludeAddress) {
      whereOptions.user = { walletAddress: Not(excludeAddress) };
    }

    const [items, itemCount] = await this.offerRepository.findAndCount({
      where: whereOptions,
      order: {
        createdAt: 'DESC',
        isActive: 'ASC',
      },
      relations: ['project', 'user'],
      select: {
        project: {
          uuid: true,
          name: true,
          tokenAddress: true,
          tokenSymbol: true,
          assetCode: true,
          assetIssuer: true,
          status: true,
        },
        user: {
          uuid: true,
        },
      },
      take: page.size,
      skip: page.offset,
    });

    return {
      data: items,
      pageNumber: page.number,
      pageSize: page.size,
      pageCount: Math.ceil(itemCount / page.size),
      itemCount,
    };
  }

  async getAllByUserUuid(userUuid: string): Promise<ICollection<Offer>> {
    const offers = await this.offerRepository.find({
      where: { project: { user: { uuid: userUuid } } },
    });

    return {
      data: offers,
      pageNumber: 1,
      pageSize: offers.length,
      pageCount: 1,
      itemCount: offers.length,
    };
  }

  async getOneByFilter(filter: FilterOptions<Offer>): Promise<Offer> {
    return this.offerRepository.findOne({
      where: filter,
      relations: ['project', 'user'],
      select: {
        project: {
          id: true,
          uuid: true,
          name: true,
          tokenAddress: true,
          tokenSymbol: true,
          assetCode: true,
          assetIssuer: true,
          status: true,
        },
        user: {
          uuid: true,
          id: true,
        },
      },
    });
  }

  async saveOne(offer: Offer): Promise<Offer> {
    return this.offerRepository.save(offer);
  }

  async updateOneOrFail(
    id: number,
    updates: Partial<Omit<Offer, 'id'>>,
  ): Promise<Offer> {
    const offerToUpdate = await this.offerRepository.preload({
      id,
      ...updates,
    });

    if (!offerToUpdate) {
      throw new OfferNotFoundException({
        message: `Offer with ID ${id} not found`,
      });
    }

    return this.offerRepository.save(offerToUpdate);
  }
}
