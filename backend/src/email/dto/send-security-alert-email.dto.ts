import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SendSecurityAlertEmailDto {
  @ApiProperty({
    description: 'Email recipient',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Type of security alert',
    example: 'Compromised Password',
  })
  @IsString()
  @IsNotEmpty()
  alertType: string;

  @ApiProperty({
    description: 'Additional details about the alert',
    example: {
      passwordName: 'Gmail',
      severity: 'High',
      recommendation: 'Change your password immediately',
    },
  })
  @IsObject()
  @IsNotEmpty()
  details: any;

  @ApiProperty({
    description: 'Username or display name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
