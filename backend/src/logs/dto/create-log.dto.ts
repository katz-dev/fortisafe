import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LogLevel } from '../entities/log.entity';

export class CreateLogDto {
  @ApiProperty({
    enum: LogLevel,
    default: LogLevel.INFO,
    description: 'Log severity level',
  })
  @IsEnum(LogLevel)
  @IsNotEmpty()
  level: LogLevel;

  @ApiProperty({ description: 'Log message content' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    required: false,
    description: 'Source of the log (e.g., system, user, component name)',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({
    required: false,
    description: 'Additional structured data related to the log',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    required: false,
    description: 'ID of the user associated with this log',
  })
  @IsString()
  @IsOptional()
  userId?: string;
}
