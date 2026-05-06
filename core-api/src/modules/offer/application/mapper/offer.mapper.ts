import { Injectable } from '@nestjs/common';
import { Offer } from '../../domain/offer.domain';
import { OfferResponseDto } from '../dto/offer-response.dto';

@Injectable()
export class OfferMapper {
  private maskSeller(uuid?: string) {
    const value = String(uuid ?? '').trim();
    if (!value) return 'Investor •••';
    return `Investor •••${value.slice(-3)}`;
  }

  fromOfferToOfferResponseDto(offer: Offer): OfferResponseDto {
    const MULTIPLIER = 10 ** 7;
    const quantity = offer.amount / MULTIPLIER;
    const pricePerToken = offer.price / MULTIPLIER;
    const totalValue = quantity * pricePerToken;
    const status = offer.isActive
      ? 'LIVE'
      : quantity > 0
      ? 'CANCELLED'
      : 'FILLED';

    const offerResponseDto = new OfferResponseDto();
    offerResponseDto.id = offer.uuid;
    offerResponseDto.createdAt = offer.createdAt;
    offerResponseDto.updatedAt = offer.updatedAt;
    offerResponseDto.deletedAt = offer.deletedAt;
    offerResponseDto.price = pricePerToken;
    offerResponseDto.amount = quantity;
    offerResponseDto.isActive = offer.isActive;
    offerResponseDto.user = offer.user.uuid;
    offerResponseDto.sellerDisplayName = this.maskSeller(offer.user.uuid);
    offerResponseDto.quantity = quantity;
    offerResponseDto.remainingQuantity = quantity;
    offerResponseDto.pricePerToken = pricePerToken;
    offerResponseDto.totalValue = totalValue;
    offerResponseDto.status = status;
    offerResponseDto.tokenSymbol =
      offer.project.assetCode || offer.project.tokenSymbol;
    offerResponseDto.projectName = offer.project.name;
    offerResponseDto.project = {
      id: offer.project.uuid,
      name: offer.project.name,
      tokenAddress: offer.project.tokenAddress,
      tokenSymbol: offer.project.tokenSymbol,
      assetCode: offer.project.assetCode,
      assetIssuer: offer.project.assetIssuer,
      status: offer.project.status,
    };

    return offerResponseDto;
  }
}
