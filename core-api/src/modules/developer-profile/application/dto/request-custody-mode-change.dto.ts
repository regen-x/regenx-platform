import { IsIn, IsOptional, IsString } from 'class-validator';

export class RequestCustodyModeChangeDto {
  @IsIn(['self_custody', 'regenx_custody'])
  requestedMode: 'self_custody' | 'regenx_custody';

  @IsOptional()
  @IsString()
  reason?: string;
}
