import { ApiProperty } from '@nestjs/swagger';

export class UrlThreatInfo {
  @ApiProperty({
    example: 'https://example.com',
    description: 'The URL that was scanned',
  })
  url: string;

  @ApiProperty({
    example: true,
    description: 'Whether the URL is safe or not',
  })
  isSafe: boolean;

  @ApiProperty({
    example: ['MALWARE', 'SOCIAL_ENGINEERING'],
    description: 'Types of threats found (if any)',
    required: false,
  })
  threatTypes?: string[];
}

export class PasswordCheckResult {
  @ApiProperty({
    example: true,
    description: 'Whether the password has been compromised',
  })
  isCompromised: boolean;

  @ApiProperty({
    example: 42,
    description: 'Number of times the password has been found in data breaches',
    required: false,
  })
  breachCount?: number;
}

export class MarkedPasswordInfo {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the password',
  })
  id: string;

  @ApiProperty({
    example: 'Google',
    description: 'The website or service name',
  })
  website: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The username or email used for the account',
  })
  username: string;

  @ApiProperty({
    example: true,
    description: 'Whether the password has been found in data breaches',
  })
  isCompromised: boolean;

  @ApiProperty({
    example: 42,
    description: 'Number of times the password has been found in data breaches',
  })
  breachCount: number;

  @ApiProperty({
    example: false,
    description: 'Whether the URL is flagged as unsafe by security scanners',
  })
  isUrlUnsafe: boolean;

  @ApiProperty({
    example: ['MALWARE', 'SOCIAL_ENGINEERING'],
    description: 'Types of threats associated with the URL',
  })
  urlThreatTypes?: string[];

  @ApiProperty({
    example: true,
    description: 'Whether this password is reused across multiple accounts',
  })
  isReused: boolean;

  @ApiProperty({
    example: [{ website: 'Google', username: 'user@example.com' }],
    description: 'List of other websites where this password is used',
  })
  reusedIn?: { website: string; username: string }[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'When the password was last scanned for security issues',
  })
  lastScanned?: Date;
}

export class ScanResultDto {
  @ApiProperty({
    type: [UrlThreatInfo],
    description: 'Results of URL scanning',
    required: false,
  })
  urlResults?: UrlThreatInfo[];

  @ApiProperty({
    type: PasswordCheckResult,
    description: 'Results of password checking',
    required: false,
  })
  passwordResult?: PasswordCheckResult;

  @ApiProperty({
    example: true,
    description: 'Whether the email has been compromised',
    required: false,
  })
  isEmailCompromised?: boolean;

  @ApiProperty({
    type: [MarkedPasswordInfo],
    description: 'List of passwords with security markings',
    required: false,
  })
  markedPasswords?: MarkedPasswordInfo[];
  
  @ApiProperty({
    example: 5,
    description: 'Number of weak passwords found',
    required: false,
  })
  weakPasswords?: number;
  
  @ApiProperty({
    example: 3,
    description: 'Number of reused passwords found',
    required: false,
  })
  reusedPasswords?: number;
  
  @ApiProperty({
    example: 10,
    description: 'Number of strong passwords found',
    required: false,
  })
  strongPasswords?: number;
  
  @ApiProperty({
    example: 2,
    description: 'Number of compromised passwords found',
    required: false,
  })
  compromisedPasswords?: number;
}
