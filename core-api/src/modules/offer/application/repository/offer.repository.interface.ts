import { ICollection } from '../../../../common/application/dto/collection.interface';
import {
  FilterOptions,
  IGetAllOptions,
} from '../../../../common/application/interface/get-all-options.interface';
import { Offer } from '../../domain/offer.domain';

export const OFFER_REPOSITORY_KEY = 'offer_repository';

export interface IOfferRepository {
  getAll(
    options: IGetAllOptions<
      Offer & {
        tokenSymbol?: string;
        userAddress?: string;
        excludeAddress?: string;
      }
    >,
  ): Promise<ICollection<Offer>>;
  getAllByUserUuid(userUuid: string): Promise<ICollection<Offer>>;
  getOneByFilter(filter: FilterOptions<Offer>): Promise<Offer>;
  saveOne(offer: Offer): Promise<Offer>;
  updateOneOrFail(
    id: number,
    updates: Partial<Omit<Offer, 'id'>>,
  ): Promise<Offer>;
}
