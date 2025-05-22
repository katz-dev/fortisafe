import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendPasswordResetEmailDto {
  @ApiProperty({
    description: 'Email recipient',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password reset token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({
    description: 'Username or display name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
