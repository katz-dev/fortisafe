import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreatePasswordDto {
  @ApiProperty({
    example: 'Google',
    description: 'The website or service name',
  })
  @IsString()
  @IsNotEmpty()
  website: string;

  @ApiProperty({
    example: 'https://google.com',
    description: 'The URL of the website',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The username or email used for the account',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'MySecurePassword123!',
    description: 'The password to be stored (will be encrypted)',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'Personal Google account',
    description: 'Notes about this password entry',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: ['work', 'important'],
    description: 'Tags for categorizing passwords',
    required: false,
  })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'When the password was last updated',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  lastUpdated?: Date;
}
