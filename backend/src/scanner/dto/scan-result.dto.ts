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
}
