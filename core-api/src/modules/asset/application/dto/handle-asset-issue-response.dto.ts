import { ApiProperty } from '@nestjs/swagger';

export class HandleAssetIssueResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  address: string;
}
