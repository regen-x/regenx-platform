import { Injectable } from '@nestjs/common';
import { BaseResponseAdapter } from '../../../../common/application/adapter/base-response.adapter';

@Injectable()
export class TransactionResponseAdapter extends BaseResponseAdapter {}
