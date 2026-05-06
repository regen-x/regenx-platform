import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OfferResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  user: string;

  @ApiProperty()
  sellerDisplayName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  remainingQuantity: number;

  @ApiProperty()
  pricePerToken: number;

  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  tokenSymbol: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty()
  project: {
    id: string;
    name: string;
    tokenAddress: string;
    tokenSymbol: string;
    assetCode?: string;
    assetIssuer?: string;
    status?: string;
  };

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  deletedAt?: string;
}
