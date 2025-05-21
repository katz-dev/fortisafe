import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CheckReusedPasswordDto {
  @ApiProperty({
    description: 'Password to check for reuse',
    example: 'MySecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
