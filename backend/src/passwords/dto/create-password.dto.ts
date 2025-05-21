import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsArray,
  IsDateString,
  IsBoolean,
  IsNumber,
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

  @ApiProperty({
    example: true,
    description: 'Whether the password has been found in data breaches',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isCompromised?: boolean;

  @ApiProperty({
    example: 42,
    description: 'Number of times the password has been found in data breaches',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  breachCount?: number;

  @ApiProperty({
    example: false,
    description: 'Whether the URL is flagged as unsafe by security scanners',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isUrlUnsafe?: boolean;

  @ApiProperty({
    example: ['MALWARE', 'SOCIAL_ENGINEERING'],
    description: 'Types of threats associated with the URL',
    required: false,
  })
  @IsArray()
  @IsOptional()
  urlThreatTypes?: string[];

  @ApiProperty({
    example: true,
    description: 'Whether this password is reused across multiple accounts',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isReused?: boolean;

  @ApiProperty({
    example: [{ website: 'Google', username: 'user@example.com' }],
    description: 'List of other websites where this password is used',
    required: false,
  })
  @IsOptional()
  reusedIn?: { website: string; username: string }[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'When the password was last scanned for security issues',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  lastScanned?: Date;
}
