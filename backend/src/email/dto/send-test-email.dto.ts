import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendTestEmailDto {
  @ApiProperty({
    description: 'Email recipient',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Username or display name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
