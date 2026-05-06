import { IsString } from 'class-validator';
import { IsStellarPublicKey } from '../../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';

export class GetUserPortfolioParamsDto {
  @IsStellarPublicKey()
  @IsString()
  userAddress: string;
}
