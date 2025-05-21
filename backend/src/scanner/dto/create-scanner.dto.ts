import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUrl, IsMongoId } from 'class-validator';

export class CreateScannerDto {
  @ApiProperty({
    example: ['https://example.com', 'https://test.com'],
    description: 'URLs to scan for malicious content',
    required: false,
  })
  @IsArray()
  @IsOptional()
  urls?: string[];

  @ApiProperty({
    example: 'https://example.com',
    description: 'Single URL to scan for malicious content',
    required: false,
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email to check if it has been compromised',
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password to check if it has been compromised',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;
  
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'User ID to associate with the scan results',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;
  
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Password ID to update with scan results',
    required: false,
  })
  @IsString()
  @IsOptional()
  passwordId?: string;
}
