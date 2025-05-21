import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class PasswordHistoryResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of this password history entry',
  })
  @IsMongoId()
  id: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the password this history entry belongs to',
  })
  @IsMongoId()
  passwordId: Types.ObjectId;

  @ApiProperty({
    example: 'Google',
    description: 'The website or service name at the time of this password version',
  })
  @IsString()
  website: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The username or email used for the account at the time of this password version',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'MyOldPassword123!',
    description: 'The decrypted password that was previously used',
  })
  @IsString()
  password: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'When this password version was created',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-15T00:00:00.000Z',
    description: 'When this password version was replaced by a newer one',
  })
  @IsDateString()
  @IsOptional()
  replacedAt?: Date;
}
