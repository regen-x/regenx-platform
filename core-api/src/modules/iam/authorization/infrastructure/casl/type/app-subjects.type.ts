import { InferSubjects } from '@casl/ability';
import { User } from '../../../../user/domain/user.domain';
import { Project } from '../../../../../project/domain/project.domain';
import { Asset } from '../../../../../asset/domain/asset.domain';
import { Offer } from '../../../../../offer/domain/offer.domain';
import { Transaction } from '../../../../../transaction/domain/transaction.domain';

export type AppSubjects =
  | InferSubjects<
      | typeof User
      | typeof Project
      | typeof Asset
      | typeof Offer
      | typeof Transaction
    >
  | 'all';
