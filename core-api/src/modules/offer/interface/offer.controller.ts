import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { OFFER_ENTITY_NAME } from '../domain/offer.name';
import { OfferService } from '../application/service/offer.service';
import { CreateTokenOfferParamsDto } from '../application/dto/create-token-offer-params.dto';
import { ControllerEntity } from '../../../common/application/interface/decorators/endpoint-entity.decorator';
import { OneSerializedResponseDto } from '../../../common/application/dto/one-serialized-response.dto';
import { OfferResponseDto } from '../application/dto/offer-response.dto';
import { SubmitOfferTokenXdrParamsDto } from '../application/dto/submit-offer-token-xdr-params.dto';
import { UpdateTokenOfferParamsDto } from '../application/dto/update-token-offer-params.dto';
import { PageQueryParamsDto } from '../../../common/application/dto/page-query-params.dto';
import { ManySerializedResponseDto } from '../../../common/application/dto/many-serialized-response.dto';
import { OfferFilterQueryParamsDto } from '../application/dto/offer-filter-query-params.dto';
import { BuyTokenOfferParamsDto } from '../application/dto/buy-token-offer-params.dto';
import { CancelTokenOfferParamsDto } from '../application/dto/cancel-token-offer-params.dto';

@Controller('offer')
@ControllerEntity(OFFER_ENTITY_NAME)
@ApiTags('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Get()
  async getAll(
    @Query('page') page: PageQueryParamsDto,
    @Query('filter') filter: OfferFilterQueryParamsDto,
  ): Promise<ManySerializedResponseDto<OfferResponseDto>> {
    return this.offerService.findAll({
      page,
      filter,
    });
  }

  @Get(':uuid')
  async getOne(
    @Param('uuid') uuid: string,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    return await this.offerService.findOneByUuid(uuid);
  }

  @Post(':uuid/cancel')
  async cancelOffer(
    @Param('uuid') uuid: string,
    @Body() { userAddress }: CancelTokenOfferParamsDto,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    return this.offerService.cancelTokenOfferXdr(uuid, userAddress);
  }

  @Post(':uuid/buy')
  async buyOffer(
    @Param('uuid') uuid: string,
    @Body() { buyerAddress }: BuyTokenOfferParamsDto,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    return this.offerService.buyTokenOfferXdr(uuid, buyerAddress);
  }

  @Post()
  async create(
    @Body() createOfferDto: CreateTokenOfferParamsDto,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    return this.offerService.createTokenOfferXdr(createOfferDto);
  }

  @Post(':uuid/price')
  async updatePrice(
    @Param('uuid') uuid: string,
    @Body() updateProjectDto: UpdateTokenOfferParamsDto,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    return this.offerService.updateTokenOfferPriceXdr(
      updateProjectDto,
      uuid,
      updateProjectDto.userAddress,
    );
  }

  @Post('submit')
  async submit(
    @Body() { xdr, type, userAddress }: SubmitOfferTokenXdrParamsDto,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    return this.offerService.submitTokenOfferXdr(xdr, userAddress, type);
  }
}
