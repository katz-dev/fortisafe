import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';

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
}