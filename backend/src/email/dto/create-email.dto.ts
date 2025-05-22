import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateEmailDto {
  @ApiProperty({
    description: 'Email recipient',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to FortiSafe',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Email content',
    example: '<p>Welcome to FortiSafe!</p>',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
